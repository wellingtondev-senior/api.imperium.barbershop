import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { 
  MailerConfirmationRegisterEmailDto, 
  MailerTesteEmailDto,
  PaymentSuccessEmailDto,
  PaymentFailedEmailDto,
  PaymentContextDto
} from './dto/mailer.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SendMailProducerService } from '../../modulos/jobs/sendmail.producer.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { Role } from '../../enums/role.enum';

@Injectable()
export class MailerService {
  private className: string;
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
      await this.sendMailProducerService.sendEmailTeste(mailerTesteEmailDto);
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

  async sendEmailConfirmRegister(emailData: MailerConfirmationRegisterEmailDto) {
    try {
    this.sendMailProducerService.sendEmailConfirmationRegister(emailData);

      return {
        statusCode: 200,
        message: 'Email de confirmação enviado com sucesso'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sendEmailConfirmPayment(options: PaymentSuccessEmailDto) {
    try {
      await this.sendMailProducerService.sendEmailPaymentSuccess(options);
      return {
        statusCode: 200,
        message: 'Email de confirmação de pagamento enviado com sucesso'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sendEmailPaymentFailed(paymentEmailDto: PaymentFailedEmailDto) {
    try {
      this.loggerService.log({
        className: this.className,
        functionName: 'sendEmailPaymentFailed',
        message: `Iniciando envio de email de falha no pagamento para ${paymentEmailDto.to}`,
      });

      await this.sendMailProducerService.sendEmailPaymentFailure({
        to: paymentEmailDto.to,
        subject: paymentEmailDto.subject,
        template: paymentEmailDto.template,
        context: {
          amount: paymentEmailDto.context.amount,
          date: paymentEmailDto.context.date,
          serviceName: paymentEmailDto.context.serviceName,
          professionalName: paymentEmailDto.context.professionalName,
          clientName: paymentEmailDto.context.clientName,
          scheduleId: paymentEmailDto.context.scheduleId,
          paymentId: paymentEmailDto.context.paymentId,
          errorMessage: paymentEmailDto.context.errorMessage
        }
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
        message: `Erro ao enviar email de falha no pagamento para ${paymentEmailDto.to}`,
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      throw new HttpException(
        'Erro ao enviar email de falha no pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}