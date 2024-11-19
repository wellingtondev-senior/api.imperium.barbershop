import { Module } from '@nestjs/common';
import { ServicesScheduleService } from './services-schedule.service';
import { ServicesScheduleController } from './services-schedule.controller';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    SessionHashModule ,
    JwtModule,
    MailerModule
  ],
  controllers: [ServicesScheduleController],
  providers: [ServicesScheduleService],
})
export class ServicesScheduleModule {}
