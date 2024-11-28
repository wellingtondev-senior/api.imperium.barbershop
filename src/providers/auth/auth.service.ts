import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express'
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { CredenciaisService } from '../../modulos/credenciais/credenciais.service';
import { CredenciaisDto } from '../../modulos/credenciais/dto/credenciais.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { SendMailProducerService } from 'src/modulos/jobs/sendmail.producer.service';
import { MailerConfirmationRegisterEmailDto } from '../mailer/dto/mailer.dto';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly className = "AuthService";

  constructor(
    private readonly jwtService: JwtService,
    private readonly credenciaisService: CredenciaisService,
    private readonly loggerService: LoggerCustomService,
    private readonly prismaService: PrismaService,
    private readonly sendMailProducerService: SendMailProducerService,
    private readonly sessionHashService: SessionHashService,
    private readonly mailerService: MailerService
  ) { }

  private generateAuthResponse(email: string, userData: any, userDetails: any) {
    const user = userDetails || {};
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: {
        email: email,
        create_at: userData.user.create_at,
        update_at: userData.user.update_at,
        role: userData.user.role,
        active: userData.user.active,
        access_token: this.jwtService.sign({
          email: email,
          create_at: userData.user.create_at,
          update_at: userData.user.update_at,
          role: userData.user.role,
          active: userData.user.active,
          user: user
        }),
        user: user
      }
    };
  }

  async register(credenciaisDto: CredenciaisDto) {
    try {
      const result = await this.credenciaisService.create(credenciaisDto);

      // Enviar email de confirmação apenas para ADM e PROFESSIONAL
      if (result.message.user.role === Role.ADM || result.message.user.role === Role.PROFESSIONAL) {
        await this.mailerService.sendEmailConfirmRegister({
          to: result.message.user.email,
          subject: 'Confirmação de Registro',
          template: 'confirm-register',
          context: {
            name: result.message.user.name,
            email: result.message.user.email,
            hash: (await this.sessionHashService.generateHash(result.message.user.id)).hash
          }
        });
      }

      return result;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'register',
        message: error.message,
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async authentication(email: string, password: string) {
    try {
      // Verifica se é usuário master (sempre active true)
      if (email === process.env.EMAIL_MASTER && password === process.env.PASSWORD_MASTER) {
        return await this.authMaster(email, password);
      }

      // Busca credenciais do usuário
      const resultCredenciais = await this.credenciaisService.findEmail(email);

      if (!resultCredenciais.message.length) {
        throw new HttpException("Credenciais incorretas", HttpStatus.NOT_ACCEPTABLE);
      }

      const userData = resultCredenciais.message[0];
      const userRole = userData.user.role;

      // Se for ADM ou PROFESSIONAL, verifica se está ativo
      if ((userRole === Role.ADM || userRole === Role.PROFESSIONAL) && !userData.user.active) {
        // Busca hash existente para o usuário
        const existingHash = await this.prismaService.sessionHash.findFirst({
          where: {
            userId: userData.user.id,
            action: 'confirm-register',
          },
        });

        // Verifica se a hash está expirada ou não existe
        const needsNewHash = !existingHash ||
          !existingHash.status ||
          existingHash.validate < new Date();

        if (needsNewHash) {
          // Se existir uma hash antiga, atualiza ela
          if (existingHash) {
            await this.prismaService.sessionHash.update({
              where: {
                id: existingHash.id
              },
              data: {
                status: false
              }
            });
          }

          // Gera nova hash
          const newHash = await this.sessionHashService.generateHash(userData.user.id);

          // Envia email de confirmação
          await this.mailerService.sendEmailConfirmRegister({
            to: userData.user.email,
            subject: 'Confirmação de Registro',
            template: 'confirmation-register',
            context: {
              name: userData.user.name,
              email: userData.user.email,
              hash: newHash.hash
            }
          });
        }
      }

      // Busca os dados específicos do usuário
      let userDetails = null;
      if (userRole === Role.ADM) {
        userDetails = userData.user.adm;
      } else if (userRole === Role.PROFESSIONAL) {
        userDetails = userData.user.professional;
      }

      return this.generateAuthResponse(email, userData, userDetails);

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'authentication',
        message: error.message,
      });
      throw error;
    }
  }

  async authMaster(user: string, password: string) {
    try {
      const payload = {
        id: 0,
        email: user,
        role: "MASTER",
        active: true,
        user: []
      };

      return {
        statusCode: HttpStatus.ACCEPTED,
        message: {
          id: payload.id,
          email: payload.email,
          role: "MASTER",
          active: true,
          access_token: this.jwtService.sign(payload),
          user: []
        }
      };
    } catch (error) {
      throw new HttpException("Erro no servidor ao efetuar o login", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validate(email: string, password: string): Promise<boolean> {
    try {
      if (email === process.env.EMAIL_MASTER && password === process.env.PASSWORD_MASTER) {
        return true;
      }

      const resultCredenciais = await this.prismaService.credenciais.findFirst({
        where: { email },
        include: { user: true }
      });

      if (!resultCredenciais) {
        throw new Error("Credenciais incorretas");
      }

      const isPasswordValid = await bcrypt.compare(password, resultCredenciais.password);
      if (!isPasswordValid) {
        throw new Error("Credenciais incorretas");
      }

      return true;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'validate',
        message: error.message,
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async refreshToken(token: string) {
    if (!await this.verifyRefreshToken(token)) {
      throw new HttpException("Token inválido ou expirado", HttpStatus.UNAUTHORIZED);
    }

    try {
      const tokenValidate = this.jwtService.verify(token);
      const payload = {
        id: tokenValidate.id,
        email: tokenValidate.email,
        name: tokenValidate.name,
        role: tokenValidate.role,
        active: tokenValidate.active,
        code: tokenValidate.code_hash
      };

      return {
        role: tokenValidate.role,
        active: tokenValidate.active,
        access_token: this.jwtService.sign(payload)
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'refreshToken',
        message: "Erro ao gerar o token de refresh",
      });
      throw new HttpException("Erro ao renovar token", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyRefreshToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }

  async forgotPassword(password: string, userId: number, hash: string) {
    throw new HttpException('Método não implementado', HttpStatus.NOT_IMPLEMENTED);
  }
}