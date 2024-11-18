import { FansService } from './fans.service';
import { FansController } from './fans.controller';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { SessionHashModule } from '../session-hash/session-hash.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        PrismaModule,
        LoggerCustomModule,
        JwtModule,
        SessionHashModule,
        MailerModule, 
    ],
    controllers: [
        FansController,],
    providers: [
        FansService,],
})
export class FansModule { }
