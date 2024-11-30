import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SendMailProducerService } from './sendmail.producer.service';
import { MailerModule } from '../../../providers/mailer/mailer.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sendmail-queue',
    }),
    MailerModule,
  ],
  providers: [SendMailProducerService],
  exports: [SendMailProducerService],
})
export class SendMailModule {}
