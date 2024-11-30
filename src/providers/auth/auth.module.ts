import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../../config/jwt';
import { ConfigModule } from '@nestjs/config';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { CredenciaisModule } from '../../modulos/credenciais/credenciais.module';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { MailerModule } from '../mailer/mailer.module';
import { SendMailModule } from '../../modulos/jobs/sendmail/sendmail.module';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '16h' },
        }),
        ConfigModule,
        PrismaModule,
        CredenciaisModule,
        LoggerCustomModule,
        SessionHashModule,
        MailerModule,
        SendMailModule,
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
    ], 
    exports: [
        AuthService,
    ]
})
export class AuthModule { }
