import { Injectable } from '@nestjs/common';
import { CreateNotificationDto, UpdateNotificationDto } from './notification.dto';
import { WebPushService } from 'src/modulos/web-push/web-push.service';
import { PrismaService } from 'src/modulos/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private webPushService: WebPushService,
  ) {}

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: {
        create_at : 'desc',
      },
    });
  }

  async findByProfessional(professionalId: number) {
    return this.prisma.notification.findMany({
      where: {
        professionalId: professionalId,
      },
      orderBy: {
        create_at : 'desc',
      },
    });
  }

  async findByClient(clientId: number) {
    return this.prisma.notification.findMany({
      where: {
        clientId: clientId,
      },
      orderBy: {
        create_at : 'desc',
      },
    });
  }

  async createNotification(data: CreateNotificationDto) {
    try {
      // Criar a notificação no banco de dados
      const notification = await this.prisma.notification.create({
        data: {
          title: data.title || 'Nova Notificação',
          description: data.description,
          status: data.status || 'pending',
          professionalId: data.professionalId,
          clientId: data.clientId,
          ...(data.scheduleId && { scheduleId: data.scheduleId }),
        },
      });

      // Se a notificação foi criada com sucesso, enviar notificação push
      if (!notification) {
        throw new Error('Falha ao criar notificação');
      }

      // Enviar notificação push para o profissional
      await this.webPushService.sendNotificationToUser(notification.professionalId, {
        title: notification.title,
        body: notification.description,
        data: {
          notificationId: notification.id,
          type: 'professional_notification'
        }
      });

      // Enviar notificação push para o cliente
      await this.webPushService.sendNotificationToUser(notification.clientId, {
        title: notification.title,
        body: notification.description,
        data: {
          notificationId: notification.id,
          type: 'client_notification'
        }
      });

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  async updateNotification(id: number, data: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async remove(id: number) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
