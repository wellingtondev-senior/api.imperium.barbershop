import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateFansDto } from './dto/fans.dto';
import { Role } from 'src/enums/role.enum';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';


@Injectable()
export class FansService {

    private className: string
    constructor(
        private readonly prismaService: PrismaService,
        private readonly loggerService: LoggerCustomService,
        private readonly sessionHashService: SessionHashService,
        private readonly mailerService: MailerService
    ) {
        this.className = this.constructor.name;
    }

    async create(fans: CreateFansDto) {
        try {

            const passCrypt = await bcrypt.hash(fans.password, 10)
            const findEmail = await this.prismaService.fans.findMany({
                where: {
                    email: fans.email
                }

            });
            if (findEmail.length === 0) {
                const createUser = await this.prismaService.user.create({
                    data: {
                        role: Role.CLIENT,
                    }
                });

                const createFans = await this.prismaService.fans.create({
                    data: {
                        name: fans.name,
                        email: fans.email,
                        userId: createUser.id,

                    }
                });

                await this.prismaService.credenciais.create({
                    data: {
                        email: fans.email,
                        password: passCrypt,
                        userId: createUser.id,
                    },
                });
                await this.mailerService.sendEmailConfirmRegister(createUser.id, Role.CLIENT);


                return {
                    statusCode: HttpStatus.ACCEPTED,
                    message: {
                        email: fans.email,
                        create_at: createFans.create_at,
                        update_at: createFans.update_at,
                        role: createUser.role,
                        active: createUser.active,
                        user: [createFans]
                    }
                }
            } else {
                throw new HttpException("Essa conta já  existe ", HttpStatus.NOT_ACCEPTABLE);
            }

        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'create',
                message: `Error de registro de usuario fans`
            })
            throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
        }
    }




  

}
