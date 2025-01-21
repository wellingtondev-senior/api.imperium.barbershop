import { Injectable } from '@nestjs/common';
import { CreateNotificationDto, UpdateNotificationDto } from './notification.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { FirebaseAdminService } from 'src/modulos/firebase/firebase-admin.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private firebaseAdmin: FirebaseAdminService
  ) {}

  // Métodos de Subscrição
  async saveSubscription(userId: number, fcmToken: string) {
    return await this.prisma.notificationSubscription.upsert({
      where: {
        id: await this.findSubscriptionId(userId, fcmToken) || -1,
      },
      update: {
        active: true,
        update_at: new Date(),
      },
      create: {
        userId,
        fcmToken,
        active: true,
      },
    });
  }

  private async findSubscriptionId(userId: number, fcmToken: string): Promise<number | null> {
    const subscription = await this.prisma.notificationSubscription.findFirst({
      where: {
        userId,
        fcmToken,
      },
      select: {
        id: true,
      },
    });
    return subscription?.id || null;
  }

  async getActiveSubscription(userId: number): Promise<string | null> {
    const subscription = await this.prisma.notificationSubscription.findFirst({
      where: {
        userId,
        active: true,
      },
      orderBy: {
        create_at: 'desc',
      },
    });
    return subscription?.fcmToken || null;
  }

  async deactivateSubscription(userId: number, fcmToken: string) {
    return await this.prisma.notificationSubscription.updateMany({
      where: {
        userId,
        fcmToken,
      },
      data: {
        active: false,
      },
    });
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
    const clientToken = await this.getActiveSubscription(data.clientId);
    if (clientToken) {
      await this.firebaseAdmin.sendNotification(
        clientToken,
        notification.title,
        notification.description
      );
    }

    // Enviar notificação push para o profissional
    const professionalToken = await this.getActiveSubscription(data.professionalId);
    if (professionalToken) {
      await this.firebaseAdmin.sendNotification(
        professionalToken,
        notification.title,
        notification.description
      );
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
