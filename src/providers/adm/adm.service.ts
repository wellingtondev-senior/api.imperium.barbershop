import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AdmDto } from './dto/adm.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../enums/role.enum';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AdmService {
  private className: string
  constructor(
      private readonly prismaService: PrismaService,
      private readonly loggerService: LoggerCustomService,
      private readonly sessionHashService: SessionHashService,
      private readonly mailerService: MailerService
  ) {
      this.className = this.constructor.name;
  }

  async create(admDto: AdmDto) {
    try {
      // Verificar se já existe um usuário com o mesmo email
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: admDto.email }
      });

      if (existingUser) {
        throw new HttpException(
          'Email already registered',
          HttpStatus.CONFLICT
        );
      }

      const hashedPassword = await bcrypt.hash(admDto.password, 10);

      // Criar usuário
      const user = await this.prismaService.user.create({
        data: {
          email: admDto.email,
          password: hashedPassword,
          name: admDto.name,
          role: Role.ADM
        }
      });
      
      // Gerar hash para confirmação de email
      const hash = await this.sessionHashService.generateHashAuthentication(admDto.email);

      // Enviar email de confirmação
      await this.mailerService.sendEmailConfirmRegister({
        to: admDto.email,
        subject: 'Confirmação de Registro',
        template: 'confirmation-register',
        context: {
          name: admDto.name,
          email: admDto.email,
          hash
        }
      });

      // Criar credenciais
      await this.prismaService.credenciais.create({
        data: {
          userId: user.id,
          email: admDto.email,
          password: hashedPassword
        }
      });

      // Criar administrador
      const createADM = await this.prismaService.adm.create({
        data: {
          name: admDto.name,
          email: admDto.email,
          userId: user.id,
          cpf: admDto.cpf || null
        }
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: {
          email: admDto.email,
          create_at: createADM.create_at,
          update_at: createADM.update_at,
          role: user.role,
          active: user.active,
          user: [createADM]
        }
      };

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'create',
        message: `Error creating administrator: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      // Tratamento específico para erros de unique constraint
      if (error.code === 'P2002') {
        const field = error.meta?.target[0];
        throw new HttpException(
          `${field} already exists`,
          HttpStatus.CONFLICT
        );
      }

      // Tratamento específico para erros de email
      if (error.message.includes('Email')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        'Internal server error while creating administrator',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAll() {
    try {
      const admins = await this.prismaService.adm.findMany({
        include: {
          user: true
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: admins
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAll',
        message: `Error fetching administrators: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      const admin = await this.prismaService.adm.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!admin) {
        throw new HttpException('Administrator not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: admin
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOne',
        message: `Error fetching administrator: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, admDto: AdmDto) {
    try {
      // Buscar o administrador com suas relações
      const admin = await this.prismaService.adm.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!admin) {
        throw new HttpException('Administrador não encontrado', HttpStatus.NOT_FOUND);
      }

      // Verificar se o novo email já está em uso (excluindo o próprio admin)
      if (admDto.email !== admin.email) {
        const [existingAdminEmail, existingUserEmail] = await Promise.all([
          this.prismaService.adm.findFirst({
            where: { 
              email: admDto.email,
              id: { not: admin.id }
            }
          }),
          this.prismaService.user.findFirst({
            where: { 
              email: admDto.email,
              id: { not: admin.userId }
            }
          })
        ]);

        if (existingAdminEmail || existingUserEmail) {
          throw new HttpException('Este email já está em uso por outro usuário', HttpStatus.CONFLICT);
        }
      }

      // Usar transação para garantir consistência
      return await this.prismaService.$transaction(async (prisma) => {
        // Preparar dados de atualização
        const updateData: any = {
          name: admDto.name,
          email: admDto.email,
          cpf: admDto.cpf || null
        };

        // Atualizar o administrador
        const updatedAdmin = await prisma.adm.update({
          where: { id },
          data: updateData
        });

        // Preparar dados de atualização do usuário
        const userUpdateData: any = {
          email: admDto.email,
          name: admDto.name
        };

        // Se houver nova senha, adicionar ao update
        if (admDto.password) {
          userUpdateData.password = await bcrypt.hash(admDto.password, 10);
        }

        // Atualizar o usuário
        await prisma.user.update({
          where: { id: admin.userId },
          data: userUpdateData
        });

        // Buscar e atualizar credenciais
        const credentials = await prisma.credenciais.findFirst({
          where: { userId: admin.userId }
        });

        if (credentials) {
          const credentialsUpdateData: any = {
            email: admDto.email
          };

          if (admDto.password) {
            credentialsUpdateData.password = userUpdateData.password;
          }

          await prisma.credenciais.update({
            where: { id: credentials.id },
            data: credentialsUpdateData
          });
        } else if (admDto.password) {
          // Se não existir credenciais e houver senha, criar
          await prisma.credenciais.create({
            data: {
              userId: admin.userId,
              email: admDto.email,
              password: userUpdateData.password
            }
          });
        }

        this.loggerService.log({
          className: this.className,
          functionName: 'update',
          message: `Administrador ${admin.id} atualizado com sucesso`
        });

        return {
          statusCode: HttpStatus.OK,
          message: {
            ...updatedAdmin,
            user: await prisma.user.findUnique({
              where: { id: admin.userId }
            })
          }
        };
      });

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'update',
        message: `Erro ao atualizar administrador: ${error.message}`
      });

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new HttpException(
          'Dados únicos já existem no sistema',
          HttpStatus.CONFLICT
        );
      }

      throw new HttpException(
        'Erro interno ao atualizar administrador',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async remove(id: number) {
    try {
      const admin = await this.prismaService.adm.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

      if (!admin) {
        throw new HttpException('Administrator not found', HttpStatus.NOT_FOUND);
      }

      // Remover credenciais primeiro
      await this.prismaService.credenciais.delete({
        where: { email: admin.email }
      });

      // Remover o administrador
      const deletedAdmin = await this.prismaService.adm.delete({
        where: { id }
      });

      // Remover o usuário associado
      if (admin.userId) {
        await this.prismaService.user.delete({
          where: { id: admin.userId }
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: deletedAdmin
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Error removing administrator: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
