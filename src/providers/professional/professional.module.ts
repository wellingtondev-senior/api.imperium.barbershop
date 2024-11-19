import { Module } from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { ProfessionalController } from './professional.controller';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    SessionHashModule ,
    JwtModule,
    MailerModule
  ],
  controllers: [ProfessionalController],
  providers: [ProfessionalService],
})
export class ProfessionalModule {}
