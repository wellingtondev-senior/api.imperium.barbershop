import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto-js';
import { CredenciaisDto } from './dto/credenciais.dto';
// import { EmailService } from '../email/email.service';

@Injectable()
export class CredenciaisService {

    private className: string

    constructor(
        private readonly prismaService: PrismaService,
        private readonly loggerService: LoggerCustomService,
    ) {
        this.className = "CredenciaisService"
    }

    async validateCredenciais(email: string, password: string) {
       
    try {
        if(this.isMasterUser(email, password)){
            return true
        }
         const resultCredenciais = await this.prismaService.credenciais.findFirst({
        where: { email },
        include: { user: true }
      });

      if (!resultCredenciais) {
       return false
      }

      const isPasswordValid = await bcrypt.compare(password, resultCredenciais.password);
      if (!isPasswordValid) {
        return false
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


    async findCredenciaisEmail(email: string) {
        try {
            const resultCredenciais = await this.prismaService.credenciais.findFirst({
                where:{
                    email: email 
                }, 
               include: {
                user: {
                    include: {
                        adm: true,
                        professional: true
                    }
                }
               }
            });

          return {
                    statusCode: HttpStatus.ACCEPTED,
                    message:resultCredenciais 
                }
        } catch (error) {
            this.loggerService.error({
                className:this.className, 
                functionName:'findEmail', 
                message:`Erro ao verificar email`
            })
            throw new HttpException(`Erro ao vereficar email`, HttpStatus.NOT_ACCEPTABLE);

        }
    }
    async findId(id: string) {
        try {
            const result = await this.prismaService.credenciais.findMany({
                where: {
                    id: parseInt(id)
                },
            })
            if (result.length === 0) {
                new Error(`Erro Id de usuario não existe`);
            } else {
                return {
                    statusCode: HttpStatus.ACCEPTED,
                    message: result
                }
            }

        } catch (error) {
            this.loggerService.error({
                className:this.className, 
                functionName:'findId', 
                message:`Erro ao verificar ID`
            })
            throw new HttpException(`Erro Id de usuario não existe`, HttpStatus.NOT_ACCEPTABLE);
        }
    }


    async delete(userId: number) {
        try {
            // Primeiro, encontrar as credenciais pelo userId
            const credenciais = await this.prismaService.credenciais.findFirst({
                where: {
                    userId: userId
                }
            });

            if (!credenciais) {
                throw new NotFoundException('Credenciais não encontradas');
            }

            // Depois, deletar usando o ID
            await this.prismaService.credenciais.delete({
                where: {
                    id: credenciais.id
                }
            });

            return {
                statusCode: HttpStatus.OK,
                message: 'Credenciais removidas com sucesso'
            };
        } catch (error) {
            throw new Error(`Erro ao deletar credenciais: ${error.message}`);
        }
    }
    private isMasterUser(email: string, password: string): boolean {
        return email === process.env.EMAIL_MASTER && password === process.env.PASSWORD_MASTER;
      }
}
