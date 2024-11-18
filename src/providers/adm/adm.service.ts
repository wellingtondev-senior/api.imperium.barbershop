import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateAdmDto } from './dto/update-adm.dto';
import { AdmDto } from './dto/create-adm.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/enums/role.enum';
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
            message: "Esse email já estar cadastrado"
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
  findAll(admDto: AdmDto) {
    return `This action returns all adm`;
  }
 

}
