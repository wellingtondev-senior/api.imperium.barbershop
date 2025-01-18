import { Injectable } from '@nestjs/common';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscription } from '@prisma/client';

@Injectable()
export class WebPushService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  };

  constructor(private prisma: PrismaService) {
    webPush.setVapidDetails(
      'mailto:' + process.env.VAPID_EMAIL,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey,
    );
  }

  async saveSubscription(
    userId: number,
    subscription: webPush.PushSubscription,
  ): Promise<PushSubscription> {
    // Salvar a inscrição no banco de dados
    return await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async sendNotification(
    subscription: webPush.PushSubscription,
    payload: any,
  ): Promise<boolean> {
    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }

  async sendNotificationToUser(userId: number, payload: any): Promise<boolean> {
    const subscription = await this.prisma.pushSubscription.findFirst({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('Usuário não possui inscrição para notificações push');
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    return this.sendNotification(pushSubscription, payload);
  }

  async removeSubscription(userId: number) {
    return await this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }

  getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }
}
