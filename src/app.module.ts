import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './providers/auth/auth.module';
import { FansModule } from './providers/fans/fans.module';
import { AdmModule } from './providers/adm/adm.module';
import { MailerModule } from './providers/mailer/mailer.module';
import { SessionHashModule } from './providers/session-hash/session-hash.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    AuthModule,
    FansModule,
    AdmModule,
    MailerModule,
    SessionHashModule,
    
  ],
  

})
export class AppModule { }
