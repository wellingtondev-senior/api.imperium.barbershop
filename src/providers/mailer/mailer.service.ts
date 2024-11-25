import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { 
  MailerConfirmationRegisterEmailDto, 
  MailerTesteEmailDto,
  PaymentSuccessEmailDto,
  PaymentFailedEmailDto
} from './dto/mailer.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SendMailProducerService } from '../../modulos/jobs/sendmail.producer.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { Role } from '../../enums/role.enum';

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

  async sendEmailTeste(mailerTesteEmailDto: MailerTesteEmailDto) {
    try {
      this.sendMailProducerService.sendEmailTeste(mailerTesteEmailDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Email enviado com sucesso!',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'sendEmailTeste',
        message: `Erro ao enviar email de teste para ${mailerTesteEmailDto.to}`,
      });

      throw new HttpException(
        'Erro ao enviar email de teste',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendEmailConfirmRegister(userId: number, role: Role) {
    try {
      // Buscar sessionHash e credenciais em paralelo para otimizar a performance
      const [sessionHash, user] = await Promise.all([
        this.prismaService.sessionHash.findMany({
          where: {
            userId,
            action: 'confirm-register',
            status: true,
            validate: { gte: new Date() },
          },
        }),
        this.prismaService.user.findUnique({
          where: { id: userId },
          include: {
            credenciais: true,
            professional: true,
            adm: true,
          },
        }),
      ]);

      if (!user) {
        throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
      }

      // Verificar se já existe um hash válido
      if (sessionHash.length > 0) {
        this.loggerService.log({
          className: this.className,
          functionName: 'sendEmailConfirmRegister',
          message: `Hash válido encontrado para usuário ${userId}`,
        });
        return;
      }

      // Gerar novo hash
      const hash = await this.sessionHashService.generateHash(userId, 'confirm-register');

      const name = role === Role.PROFESSIONAL 
        ? user.professional?.name 
        : role === Role.ADM 
          ? user.adm?.name 
          : user.credenciais?.name;

      // Enviar email com o hash
      await this.sendMailProducerService.sendEmail({
        to: user.email,
        subject: 'Confirmação de Cadastro - Imperium Barbershop',
        template: 'confirm-register',
        context: {
          name: name,
          hash: hash,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailConfirmRegister',
        message: `Email de confirmação enviado com sucesso para ${user.email}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Email de confirmação enviado com sucesso!',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'sendEmailConfirmRegister',
        error: error,
        message: `Erro ao enviar email de confirmação para usuário ${userId}`,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erro ao enviar email de confirmação de cadastro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendEmailConfirmPayment(paymentEmailDto: PaymentSuccessEmailDto) {
    try {
      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailConfirmPayment',
        message: `Iniciando envio de email de confirmação de pagamento para ${paymentEmailDto.to}`,
      });

      await this.sendMailProducerService.sendEmail({
        to: paymentEmailDto.to,
        subject: paymentEmailDto.subject,
        template: paymentEmailDto.template,
        context: {
          serviceName: paymentEmailDto.context.serviceName,
          professionalName: paymentEmailDto.context.professionalName,
          clientName: paymentEmailDto.context.clientName,
          date: new Date(paymentEmailDto.context.date).toLocaleDateString('pt-BR'),
          amount: paymentEmailDto.context.amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          appointmentId: paymentEmailDto.context.appointmentId,
          paymentId: paymentEmailDto.context.paymentId,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailConfirmPayment',
        message: `Email de confirmação de pagamento enviado com sucesso para ${paymentEmailDto.to}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Email de confirmação de pagamento enviado com sucesso!',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'sendEmailConfirmPayment',
        error: error,
        message: `Erro ao enviar email de confirmação de pagamento para ${paymentEmailDto.to}`,
      });

      throw new HttpException(
        'Erro ao enviar email de confirmação de pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendEmailPaymentFailed(paymentEmailDto: PaymentFailedEmailDto) {
    try {
      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailPaymentFailed',
        message: `Iniciando envio de email de falha no pagamento para ${paymentEmailDto.to}`,
      });

      await this.sendMailProducerService.sendEmail({
        to: paymentEmailDto.to,
        subject: paymentEmailDto.subject,
        template: paymentEmailDto.template,
        context: {
          serviceName: paymentEmailDto.context.serviceName,
          professionalName: paymentEmailDto.context.professionalName,
          clientName: paymentEmailDto.context.clientName,
          date: new Date(paymentEmailDto.context.date).toLocaleDateString('pt-BR'),
          amount: paymentEmailDto.context.amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
          appointmentId: paymentEmailDto.context.appointmentId,
          paymentId: paymentEmailDto.context.paymentId,
          errorMessage: paymentEmailDto.context.errorMessage,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailPaymentFailed',
        message: `Email de falha no pagamento enviado com sucesso para ${paymentEmailDto.to}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Email de falha no pagamento enviado com sucesso!',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'sendEmailPaymentFailed',
        error: error,
        message: `Erro ao enviar email de falha no pagamento para ${paymentEmailDto.to}`,
      });

      throw new HttpException(
        'Erro ao enviar email de falha no pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}