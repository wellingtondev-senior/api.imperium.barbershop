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
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorator/roles.decorator';


@ApiTags('Notifications')
@Controller('notifications')

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webPushService: WebPushService,
  ) {}

  @Version('1')
  @Post('subscribe')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  async subscribe(@Body() payload: { userId: number; subscription: any }) {
   console.log(payload)
    await this.webPushService.saveSubscription(payload.userId, payload.subscription);
    return { message: 'Subscription saved successfully!' };
  }
  @Version('1')
  @Get('vapid-public-key')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  getVapidPublicKey() {
    const publicKey = this.webPushService.getVapidPublicKey();
    return { publicKey };
  }
  @Version('1')
  @Post('send')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  async sendNotification(@Body() payload: { userId: number; message: any }) {
    await this.webPushService.sendNotificationToUser(payload.userId, payload.message);
    return { message: 'Notification sent successfully!' };
  }
  @Version('1')
  @Get('professional/:id')
  findByProfessional(@Param('id') id: string) {
    return this.notificationService.findByProfessional(+id);
  }
  @Version('1')
  @Delete(':id')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
