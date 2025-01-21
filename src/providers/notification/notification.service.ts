import { Injectable } from '@nestjs/common';
import { CreateNotificationDto, UpdateNotificationDto } from './notification.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { WebPushService } from 'src/modulos/web-push/web-push.service';
import * as webPush from 'web-push';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private webPushService: WebPushService,
  ) {}

  // Métodos de Subscrição
  async saveSubscription(userId: number, subscription: webPush.PushSubscription) {
    return await this.webPushService.saveSubscription(userId, subscription);
  }

  async deactivateSubscription(userId: number) {
    return await this.webPushService.removeSubscription(userId);
  }

  // Métodos de Notificação
  async createNotification(data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'pending',
        professionalId: data.professionalId,
        clientId: data.clientId,
        scheduleId: data.scheduleId,
      },
      include: {
        professional: true,
        client: true,
        schedule: true,
      },
    });

    // Enviar notificação push para o cliente
    if (data.clientId) {
      await this.webPushService.sendNotificationToUser(data.clientId, {
        title: notification.title,
        body: notification.description,
        data: {
          notificationId: notification.id,
          type: 'client_notification'
        }
      });
    }

    // Enviar notificação push para o profissional
    if (data.professionalId) {
      await this.webPushService.sendNotificationToUser(data.professionalId, {
        title: notification.title,
        body: notification.description,
        data: {
          notificationId: notification.id,
          type: 'professional_notification'
        }
      });
    }

    return notification;
  }

  async findAllNotifications() {
    return this.prisma.notification.findMany({
      include: {
        professional: true,
        client: true,
        schedule: true,
      },
    });
  }

  async findNotificationsByProfessional(professionalId: number) {
    return this.prisma.notification.findMany({
      where: { professionalId },
      include: {
        professional: true,
        client: true,
        schedule: true,
      },
      orderBy: {
        create_at: 'desc',
      },
    });
  }

  async findNotificationsByClient(clientId: number) {
    return this.prisma.notification.findMany({
      where: { clientId },
      include: {
        professional: true,
        client: true,
        schedule: true,
      },
      orderBy: {
        create_at: 'desc',
      },
    });
  }

  async updateNotification(id: number, data: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data,
      include: {
        professional: true,
        client: true,
        schedule: true,
      },
    });
  }

  async removeNotification(id: number) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
