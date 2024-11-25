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

    async create(credenciaisDto: CredenciaisDto) {
        try {
            this.loggerService.log({
                className: this.className,
                functionName: 'create',
                message: `Iniciando criação de credenciais para ${credenciaisDto.email}`,
            });

            // Verificar se já existe um usuário com este email
            const existingUser = await this.prismaService.credenciais.findFirst({
                where: { email: credenciaisDto.email },
            });

            if (existingUser) {
                throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
            }

            // Criptografar a senha
            const hashedPassword = await bcrypt.hash(credenciaisDto.password, 10);

            // Criar usuário e credenciais em uma transação
            const result = await this.prismaService.$transaction(async (prisma) => {
                // Criar usuário
                const user = await prisma.user.create({
                    data: {
                        role: credenciaisDto.role || 'CLIENT', // Default role is CLIENT
                        active: false, // Usuário inativo até confirmar email
                    },
                });

                // Criar credenciais
                const credenciais = await prisma.credenciais.create({
                    data: {
                        email: credenciaisDto.email,
                        password: hashedPassword,
                        userId: user.id,
                    },
                    include: {
                        user: true,
                    },
                });

                return credenciais;
            });

            this.loggerService.log({
                className: this.className,
                functionName: 'create',
                message: `Credenciais criadas com sucesso para ${credenciaisDto.email}`,
            });

            return {
                statusCode: HttpStatus.CREATED,
                message: result,
            };
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'create',
                message: `Erro ao criar credenciais para ${credenciaisDto.email}`,
            });

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                'Erro ao criar credenciais',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
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
