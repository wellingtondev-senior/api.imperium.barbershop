import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/config/jwt';
import { SendMailProducerService } from 'src/modulos/jobs/sendmail.producer.service';
import { BullModule } from '@nestjs/bull';
import { SessionHashModule } from '../session-hash/session-hash.module';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    JwtModule,
    SessionHashModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_USE_TLS === 'true' ? {} : undefined, // Se o Redis usar TLS
      },
    }),
    BullModule.registerQueue({
      name: 'sendmail-queue',
  }),

    
  ],
  controllers: [MailerController],
  providers: [
    MailerService,
    SendMailProducerService,

  ],
  exports: [MailerService],
})
export class MailerModule {}
