import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../../modulos/prisma/prisma.module';
import { WebPushModule } from '../../modulos/web-push/web-push.module';

@Module({
  imports: [PrismaModule, WebPushModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
