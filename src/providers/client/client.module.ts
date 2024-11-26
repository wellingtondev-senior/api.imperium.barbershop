import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from '../../modulos/prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    SessionHashModule,
    JwtModule,
    MailerModule
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
