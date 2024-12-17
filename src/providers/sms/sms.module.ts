import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { TwilioModule } from 'src/modulos/jobs/twilio/twilio.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TwilioModule
    ],
    controllers: [SmsController],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}
