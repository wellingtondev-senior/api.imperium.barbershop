import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateClientDto } from './dto/create-client.dto';
import { hash } from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async create(createClientDto: CreateClientDto) {
    try {
      const passCrypt = await hash(createClientDto.password, 10);

      const createUser = await this.prisma.user.create({
        data: {
          name: createClientDto.name,
          email: createClientDto.email,
          role: 'CLIENT',
          password: passCrypt
        },
      });

      await this.prisma.client.create({
        data: {
          name: createClientDto.name,
          email: createClientDto.email,
          phone: createClientDto.phone,
          userId: createUser.id,
        },
      });

      await this.mailerService.sendEmailConfirmRegister({
        to: createUser.email,
        subject: 'Confirmação de Registro',
        template: 'confirm-register',
        context: {
          name: createUser.name,
          email: createUser.email
        }
      });

      return {
        statusCode: HttpStatus.ACCEPTED,
        message: {
          email: createClientDto.email,
          message: 'Usuário criado com sucesso!',
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
