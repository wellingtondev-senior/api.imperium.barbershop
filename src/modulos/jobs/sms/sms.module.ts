import { Module } from '@nestjs/common';
import { ConfigModule} from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { SMSProducer } from './sms.producer';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.registerQueue({
      name: 'sms-queue',
    }),
    PrismaModule,
    LoggerCustomModule
  ],
  providers: [
    SMSProducer 
  ],
  exports: [
    SMSProducer 
  ],
})
export class SMSModule {}
