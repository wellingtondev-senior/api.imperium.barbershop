import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../../modulos/prisma/prisma.module';
import { FirebaseModule } from '../../modulos/firebase/firebase.module';

@Module({
  imports: [PrismaModule, FirebaseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
