import { InjectQueue } from '@nestjs/bull';
import { HttpStatus, Injectable, } from '@nestjs/common';
import { Queue } from 'bull';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from 'src/providers/mailer/dto/mailer.dto';
import { PaymentSuccessEmailDto, PaymentFailedEmailDto } from 'src/providers/mailer/dto/mailer.dto';

@Injectable()
export class SendMailProducerService {
 
    constructor(
      @InjectQueue('sendmail-queue') private sendMailQueue: Queue
      ) {
      } 

   sendEmailTeste(mailerTesteEmailDto: MailerTesteEmailDto){
       this.sendMailQueue.add('email-teste', mailerTesteEmailDto, {removeOnComplete:true});
       return {
         statusCode: HttpStatus.ACCEPTED,
         message: "Email enviado com sucesso!"
     }
    }

   async sendEmailConfirmationRegister(mailerConfirmationRegisterEmailDto: MailerConfirmationRegisterEmailDto){
      console.log(['producer'], mailerConfirmationRegisterEmailDto)
    await this.sendMailQueue.add('email-confirmation-register', mailerConfirmationRegisterEmailDto, {removeOnComplete:true});
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: "Email enviado com sucesso!"
    }
   }

   async sendEmailPaymentSuccess(paymentSuccessEmailDto: PaymentSuccessEmailDto) {
    await this.sendMailQueue.add('sendEmailPaymentSuccess', paymentSuccessEmailDto);
  }

  async sendEmailPaymentFailure(paymentFailedEmailDto: PaymentFailedEmailDto) {
    await this.sendMailQueue.add('sendEmailPaymentFailure', paymentFailedEmailDto);
  }
    
 }
