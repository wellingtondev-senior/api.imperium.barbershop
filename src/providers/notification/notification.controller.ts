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
import { WebPushService } from 'src/modulos/web-push/web-push.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateNotificationDto } from './notification.dto';
import * as webPush from 'web-push';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webPushService: WebPushService,
  ) {}

  // Endpoints de Subscrição
  @Version('1')
  @Get('vapid-public-key')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  getVapidPublicKey() {
    return { publicKey: this.webPushService.getVapidPublicKey() };
  }

  @Version('1')
  @Post('subscribe')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)    
  async subscribe(@Body() payload: { userId: number; subscription: webPush.PushSubscription }) {
    await this.notificationService.saveSubscription(
      payload.userId,
      payload.subscription
    );
    return { message: 'Subscription saved successfully!' };
  }

  @Version('1')
  @Post('unsubscribe')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  async unsubscribe(@Body() payload: { userId: number }) {
    await this.notificationService.deactivateSubscription(payload.userId);
    return { message: 'Subscription deactivated successfully!' };
  }

  // Endpoints de Notificação
  @Version('1')
  @Post()
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Version('1')
  @Get()
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  findAll() {
    return this.notificationService.findAllNotifications();
  }

  @Version('1')
  @Get('professional/:id')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  findByProfessional(@Param('id') id: string) {
    return this.notificationService.findNotificationsByProfessional(+id);
  }

  @Version('1')
  @Get('client/:id')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  findByClient(@Param('id') id: string) {
    return this.notificationService.findNotificationsByClient(+id);
  }

  @Version('1')
  @Delete(':id')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  remove(@Param('id') id: string) {
    return this.notificationService.removeNotification(+id);
  }
}
