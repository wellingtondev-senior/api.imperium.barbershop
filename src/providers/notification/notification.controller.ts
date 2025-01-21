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
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateNotificationDto, SubscriptionDto } from './notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  // Endpoints de Subscrição
  @Version('1')
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Body() payload: SubscriptionDto) {
    await this.notificationService.saveSubscription(
      payload.userId,
      payload.fcmToken
    );
    return { message: 'Subscription saved successfully!' };
  }

  @Version('1')
  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Body() payload: SubscriptionDto) {
    await this.notificationService.deactivateSubscription(
      payload.userId,
      payload.fcmToken
    );
    return { message: 'Subscription deactivated successfully!' };
  }

  // Endpoints de Notificação
  @Version('1')
  @Post()
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Version('1')
  @Get()
  @Roles(Role.ADM)
  @UseGuards(JwtAuthGuard, RoleGuard)
  findAll() {
    return this.notificationService.findAllNotifications();
  }

  @Version('1')
  @Get('professional/:id')
  @UseGuards(JwtAuthGuard)
  findByProfessional(@Param('id') id: string) {
    return this.notificationService.findNotificationsByProfessional(+id);
  }

  @Version('1')
  @Get('client/:id')
  @UseGuards(JwtAuthGuard)
  findByClient(@Param('id') id: string) {
    return this.notificationService.findNotificationsByClient(+id);
  }

  @Version('1')
  @Delete(':id')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(JwtAuthGuard, RoleGuard)
  remove(@Param('id') id: string) {
    return this.notificationService.removeNotification(+id);
  }
}
