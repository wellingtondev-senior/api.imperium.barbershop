import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
        //private readonly emailService: EmailService
    ) {
        this.className = "CredenciaisService"
    }

    async criarHashUnica(data: any): Promise<string> {
        const hash = crypto.MD5(data); // Cria a hash SHA256 dos dados
        return hash.toString(crypto.enc.Hex); // Retorna a hash como uma string hexadecimal
    }
    async gerarCodigo(): Promise<number> {
        const codigo = Math.floor(100000 + Math.random() * 900000); // Gera um número aleatório entre 100000 e 999999
        return codigo;
    }


    async findEmail(email: string) {
        try {
            const resultCredenciais = await this.prismaService.credenciais.findMany({
                where:{
                    email: email 
                }, 
               include: {
                user:true
                
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

    async delete(id: string) {
        try {



            await this.prismaService.credenciais.delete({
                where: {
                    id: parseInt(id),

                },
            });
            return {
                statusCode: HttpStatus.ACCEPTED,
                message: "credenciais deletado com sucesso"
            }

        } catch (error) {
           this.loggerService.error({
                className:this.className, 
                functionName:'delete', 
                message:`Erro ao excluir credenciais`,
            })
            throw new HttpException(`Erro ao excluir credenciais`, HttpStatus.NOT_ACCEPTABLE);

        }
    }
}
