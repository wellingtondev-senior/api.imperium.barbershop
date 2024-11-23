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
    const passCrypt = await bcrypt.hash(admDto.password, 10)
    console.log(passCrypt)
    const findAdministrador = await this.prismaService.adm.findMany({
        where: {
            email: admDto.email
        }

    });
    if (findAdministrador.length === 0) {
        const createUser = await this.prismaService.user.create({
            data: {
                role: Role.ADM,
            }
        });

        const createADM = await this.prismaService.adm.create({
            data: {
                name: admDto.name,
                email: admDto.email,
                userId: createUser.id,

            }
        });

        await this.prismaService.credenciais.create({
            data: {
                email: admDto.email,
                password: passCrypt,
                userId: createUser.id,
            },
        });
        await this.mailerService.sendEmailConfirmRegister(createUser.id, Role.ADM);

        return {
            statusCode: HttpStatus.ACCEPTED,
            message: {
                email: admDto.email,
                create_at: createADM.create_at,
                update_at: createADM.update_at,
                role: createUser.role,
                active: createUser.active,
                user: [createADM]
            }
        }
    } else {
        return {
            statusCode: HttpStatus.OK,
            message: "Esse email já está cadastrado"
        }
    }

} catch (error) {
    this.loggerService.error({
        className:this.className, 
        functionName:'active', 
        message:`Erro ao enviar email de ativação`
    })
    throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
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
        message: `Erro ao buscar administradores: ${error.message}`
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
        throw new HttpException('Administrador não encontrado', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: admin
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOne',
        message: `Erro ao buscar administrador: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, admDto: AdmDto) {
    try {
      const admin = await this.prismaService.adm.findUnique({
        where: { id }
      });

      if (!admin) {
        throw new HttpException('Administrador não encontrado', HttpStatus.NOT_FOUND);
      }

      const updatedAdmin = await this.prismaService.adm.update({
        where: { id },
        data: {
          name: admDto.name,
          email: admDto.email,
        }
      });

      if (admDto.password) {
        const passCrypt = await bcrypt.hash(admDto.password, 10);
        await this.prismaService.credenciais.update({
          where: { email: admin.email },
          data: {
            password: passCrypt
          }
        });
      }

      return {
        statusCode: HttpStatus.OK,
        message: updatedAdmin
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'update',
        message: `Erro ao atualizar administrador: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
        throw new HttpException('Administrador não encontrado', HttpStatus.NOT_FOUND);
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
      await this.prismaService.user.delete({
        where: { id: admin.userId }
      });

      return {
        statusCode: HttpStatus.OK,
        message: deletedAdmin
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Erro ao remover administrador: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
