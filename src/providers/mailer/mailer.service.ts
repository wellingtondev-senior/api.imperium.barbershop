import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from './dto/mailer.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { SendMailProducerService } from 'src/modulos/jobs/sendmail.producer.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class MailerService {
  private className: string
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
    private readonly sendMailProducerService: SendMailProducerService,
    private readonly sessionHashService: SessionHashService,
  ) {
    this.className = this.constructor.name;
  }

  sendEmailTeste(mailerTesteEmailDto: MailerTesteEmailDto) {
    try {
      this.sendMailProducerService.sendEmailTeste(mailerTesteEmailDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Email enviado com sucesso!',
      }
    } catch (error) {
      throw new HttpException("Error ao enviar email teste", HttpStatus.NOT_ACCEPTABLE);

    }
  }
  async sendEmailConfirmRegister(userId: number, role: Role) {
    try {
      // Buscar sessionHash e credenciais em paralelo para otimizar a performance
      const [sessionHash, resultCredenciais] = await Promise.all([
        this.prismaService.sessionHash.findMany({
          where: {
            userId,
            action: 'confirm-register',
            status: true,
            validate: { gte: new Date() },
          },
        }),
        this.prismaService.user.findMany({
          where: { id: userId },
          include: {
            credenciais: true,
            fans: true,
            adm: true,
          },
        }),
      ]);
  
      // Verificar se as credenciais existem
      if (resultCredenciais.length === 0) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Usuário não encontrado ou sem credenciais válidas para o papel especificado.',
        };
      }
  
      // Obter ou criar um novo hash
      const { hash, codigo } = sessionHash.length > 0
        ? { hash: sessionHash[0].hash, codigo: sessionHash[0].codigo }
        : await this.sessionHashService.createHashConfirmRegister(userId).then(dbResponse => ({
            hash: dbResponse.message.hash,
            codigo: dbResponse.message.codigo,
          }));
  
      // Função para construir e enviar o email
      const sendEmail = (emailDto: MailerConfirmationRegisterEmailDto) => {
        this.sendMailProducerService.sendEmailConfirmationRegister(emailDto);
      };
  
      let mailerConfirmationRegisterEmailDto: MailerConfirmationRegisterEmailDto;
      
      switch (role) {
        case Role.ADM:
          mailerConfirmationRegisterEmailDto = {
            destino: resultCredenciais[0].adm?.[0]?.email,
            name: resultCredenciais[0].adm?.[0]?.name,
            hash,
            codigo,
            assunto: 'Confirmação de cadastro',
          };
          sendEmail(mailerConfirmationRegisterEmailDto);
          break;
          
        case Role.CLIENT:
          mailerConfirmationRegisterEmailDto = {
            destino: resultCredenciais[0].fans?.[0]?.email,
            name: resultCredenciais[0].fans?.[0]?.name,
            hash,
            codigo,
            assunto: 'Confirmação de cadastro',
          };
          sendEmail(mailerConfirmationRegisterEmailDto);
          break;
  
        default:
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Sem permissão para enviar email de confirmação de cadastro',
          };
      }
  
      return {
        statusCode: HttpStatus.OK,
        message: 'Email de confirmação enviado com sucesso!',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'sendEmailConfirmRegister',
        message: error.message,
      }); // Logar o erro para debug
  
      throw new HttpException(
        'Erro ao enviar email de confirmação de cadastro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  }