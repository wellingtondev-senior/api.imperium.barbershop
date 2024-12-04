import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './providers/auth/auth.module';
import { AdmModule } from './providers/adm/adm.module';
import { MailerModule } from './providers/mailer/mailer.module';
import { ProfessionalModule } from './providers/professional/professional.module';
import { ScheduleModule } from './providers/schedule/schedule.module';
import { ClientModule } from './providers/client/client.module';
import { SessionHashModule } from './providers/session-hash/session-hash.module';
import { BullModule } from '@nestjs/bull';
import { SendMailModule } from './modulos/jobs/sendmail/sendmail.module';
import { ServiceModule } from './providers/service/service.module';
import { PaymentModule } from './providers/payment/payment.module';
import { SmsModule } from './providers/sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    AuthModule,
    AdmModule,
    MailerModule,
    ProfessionalModule,
    ClientModule,
    ScheduleModule,
    SessionHashModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_USE_TLS === 'true' ? {} : undefined, // Se o Redis usar TLS
      },
    }),
    SendMailModule,
    ServiceModule ,
    PaymentModule,
    SmsModule
  ],
  providers: [],
})
export class AppModule { }
