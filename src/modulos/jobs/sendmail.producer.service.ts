import { InjectQueue } from '@nestjs/bull';
import { HttpStatus, Injectable, } from '@nestjs/common';
import { Queue } from 'bull';
import { MailerConfirmationRegisterEmailDto, MailerTesteEmailDto } from 'src/providers/mailer/dto/mailer.dto';



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

   sendEmailConfirmationRegister(mailerConfirmationRegisterEmailDto: MailerConfirmationRegisterEmailDto){
      console.log(mailerConfirmationRegisterEmailDto)
    this.sendMailQueue.add('email-confirmation-register', mailerConfirmationRegisterEmailDto, {removeOnComplete:true});
      return {
        statusCode: HttpStatus.ACCEPTED,
        message: "Email enviado com sucesso!"
    }
   }
    
 }

