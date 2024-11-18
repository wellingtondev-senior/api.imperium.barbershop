import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../../strategy/jwt.strategy';
import { jwtConstants } from '../../config/jwt'
import { ConfigModule } from '@nestjs/config';
import { AuthenticationStrategy } from '../../strategy/authentication.strategy';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/guards/auth.guard';
import { CredenciaisModule } from '../credenciais/credencias.module';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { SendMailProducerService } from 'src/modulos/jobs/sendmail.producer.service';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, }),
        JwtModule.register({
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '940m' },
        }),
        PrismaModule,
        CredenciaisModule,
        LoggerCustomModule,
        SessionHashModule,
        MailerModule,
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
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
        SendMailProducerService,
    ], 
    exports: [
        AuthService
    ],
})
export class AuthModule { }
