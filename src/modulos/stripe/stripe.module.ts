import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { LoggerCustomModule } from '../logger/logger.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    LoggerCustomModule,
    ConfigModule.forRoot({ isGlobal: true, }),

  ],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
