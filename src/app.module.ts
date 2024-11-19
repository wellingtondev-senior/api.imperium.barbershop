import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './providers/auth/auth.module';
import { AdmModule } from './providers/adm/adm.module';
import { MailerModule } from './providers/mailer/mailer.module';
import { SessionHashModule } from './providers/session-hash/session-hash.module';
import { ServicesScheduleModule } from './providers/services-schedule/services-schedule.module';
import { ProfessionalModule } from './providers/professional/professional.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    AuthModule,
    AdmModule,
    MailerModule,
    SessionHashModule,
    ServicesScheduleModule,
    ProfessionalModule,
    
  ],
  

})
export class AppModule { }
