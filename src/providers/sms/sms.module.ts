import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { SMSModule } from 'src/modulos/jobs/sms/sms.module';

@Module({
    imports: [
        ConfigModule.forRoot(),
        SMSModule,
        LoggerCustomModule
    ],
    controllers: [SmsController],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}
