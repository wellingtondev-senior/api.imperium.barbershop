import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../mailer/mailer.module';
import { CredenciaisModule } from 'src/modulos/credenciais/credenciais.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    JwtModule,
    MailerModule,
    CredenciaisModule,
    SmsModule
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService]
})
export class ScheduleModule {}
