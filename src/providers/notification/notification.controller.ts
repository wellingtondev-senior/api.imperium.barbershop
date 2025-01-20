import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Version,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { WebPushService } from '../../modulos/web-push/web-push.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';


@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webPushService: WebPushService,
  ) {}

  @Version('1')
  @Post('subscribe')
  async subscribe(@Body() payload: { userId: number; subscription: any }) {
   console.log(payload)
    await this.webPushService.saveSubscription(payload.userId, payload.subscription);
    return { message: 'Subscription saved successfully!' };
  }
  @Version('1')
  @Get('vapid-public-key')
  getVapidPublicKey() {
    const publicKey = this.webPushService.getVapidPublicKey();
    return { publicKey };
  }

  @Post('send')
  async sendNotification(@Body() payload: { userId: number; message: any }) {
    await this.webPushService.sendNotificationToUser(payload.userId, payload.message);
    return { message: 'Notification sent successfully!' };
  }

  @Get('professional/:id')
  findByProfessional(@Param('id') id: string) {
    return this.notificationService.findByProfessional(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
