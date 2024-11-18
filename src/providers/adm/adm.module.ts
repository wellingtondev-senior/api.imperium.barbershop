import { Module } from '@nestjs/common';
import { AdmService } from './adm.service';
import { AdmController } from './adm.controller';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/config/jwt';
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
  controllers: [AdmController],
  providers: [AdmService],
})
export class AdmModule {}
