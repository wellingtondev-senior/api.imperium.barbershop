import { Module } from '@nestjs/common';
import { WebPushService } from './web-push.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WebPushService],
  exports: [WebPushService],
})
export class WebPushModule {}
