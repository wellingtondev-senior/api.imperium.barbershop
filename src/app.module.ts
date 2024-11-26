import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './providers/auth/auth.module';
import { AdmModule } from './providers/adm/adm.module';
import { MailerModule } from './providers/mailer/mailer.module';
import { ProfessionalModule } from './providers/professional/professional.module';
import { ScheduleModule } from './providers/schedule/schedule.module';
import { ClientModule } from './providers/client/client.module';
import { SessionHashModule } from './providers/session-hash/session-hash.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    AuthModule,
    AdmModule,
    MailerModule,
    ProfessionalModule,
    ClientModule,
    ScheduleModule,
    SessionHashModule
  ],
  

})
export class AppModule { }
