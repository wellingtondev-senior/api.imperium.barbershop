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
    const hashedPassword = await bcrypt.hash(admDto.password, 10)

    // Criar usuário
    const user = await this.prismaService.user.create({
      data: {
        email: admDto.email,
        password: hashedPassword,
        name: admDto.name,
        role: Role.ADM
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
    throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
          cpf: admDto.cpf || null
        }
      });

      if (admDto.password) {
        const hashedPassword = await bcrypt.hash(admDto.password, 10);
        await this.prismaService.credenciais.update({
          where: { email: admin.email },
          data: {
            password: hashedPassword
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
