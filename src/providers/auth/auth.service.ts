import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express'
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { CredenciaisService } from '../../modulos/credenciais/credenciais.service';
import { CredenciaisDto } from '../../modulos/credenciais/dto/credenciais.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { SendMailProducerService } from 'src/modulos/jobs/sendmail/sendmail.producer.service';
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

  private generateAuthResponse(email: string, credenciais: any, userDetails: any) {
    const user = userDetails || {};
    return {
      statusCode: HttpStatus.ACCEPTED,
      message: {
        email: email,
        create_at: credenciais.user.create_at,
        update_at: credenciais.user.update_at,
        role: credenciais.user.role,
        active: credenciais.user.active,
        access_token: this.jwtService.sign({
          email: email,
          create_at: credenciais.user.create_at,
          update_at: credenciais.user.update_at,
          role: credenciais.user.role,
          active: credenciais.user.active,
          user: user
        }),
        user: user
      }
    };
  }

  async authentication(email: string, password: string) {
    try {
      // 1. Master user check
      if (this.isMasterUser(email, password)) {
        return await this.authMaster(email);
      }

      // 2. Validate credentials
      const isValidCredentials = await this.credenciaisService.validateCredenciais(email, password);
      if (!isValidCredentials) {
        throw new HttpException("Credenciais incorretas", HttpStatus.UNAUTHORIZED);
      }

      // 3. Get user data
      const { message: credenciais } = await this.credenciaisService.findCredenciaisEmail(email);
      if (!credenciais) {
        throw new HttpException("Usuário não encontrado", HttpStatus.NOT_FOUND);
      }

      const userRole = credenciais.user.role;
      const userDetails = await this.getUserDetails(credenciais.user);

      // 4. Handle inactive ADM/PROFESSIONAL users
      if (this.requiresEmailConfirmation(userRole) && !credenciais.user.active) {
        await this.handleInactiveUser(credenciais.user);
        return this.generateAuthResponse(email, credenciais, userDetails);
      }

      // 5. Generate response for active users
      return this.generateAuthResponse(email, credenciais, userDetails);

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'authentication',
        message: error.message,
      });
      throw new HttpException(
        error instanceof HttpException ? error.message : "Erro interno do servidor", 
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private isMasterUser(email: string, password: string): boolean {
    return email === process.env.EMAIL_MASTER && password === process.env.PASSWORD_MASTER;
  }

  private requiresEmailConfirmation(role: string): boolean {
    return role === Role.ADM || role === Role.PROFESSIONAL;
  }

  private async getUserDetails(user: any) {
    if (user.role === Role.ADM) {
      return user.adm;
    }
    if (user.role === Role.PROFESSIONAL) {
      return user.professional;
    }
    return null;
  }

  private async handleInactiveUser(user: any) {
    const hash = await this.sessionHashService.generateHashAuthentication(user.email);
    
    await this.mailerService.sendEmailConfirmRegister({
      to: user.email,
      subject: 'Confirmação de email',
      template: 'confirmation-register',
      context: {
        name: user.name,
        email: user.email,
        hash
      }
    });
  }

  async authMaster(user: string) {
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

}