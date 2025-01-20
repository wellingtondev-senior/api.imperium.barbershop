import { Injectable, OnModuleInit } from '@nestjs/common';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscription } from '@prisma/client';

@Injectable()
export class WebPushService implements OnModuleInit {
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor(private prisma: PrismaService) {
    // Gerar novas chaves VAPID se não existirem
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.log('Gerando novas chaves VAPID...');
      const newKeys = webPush.generateVAPIDKeys();
      this.vapidKeys = {
        publicKey: newKeys.publicKey,
        privateKey: newKeys.privateKey,
      };
      console.log('Novas chaves VAPID geradas. Adicione ao seu .env:');
      console.log(`VAPID_PUBLIC_KEY=${this.vapidKeys.publicKey}`);
      console.log(`VAPID_PRIVATE_KEY=${this.vapidKeys.privateKey}`);
    } else {
      this.vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
      };
    }
  }

  onModuleInit() {
    if (!process.env.VAPID_EMAIL) {
      console.error('VAPID_EMAIL não configurado no .env');
      return;
    }

    try {
      webPush.setVapidDetails(
        'mailto:' + process.env.VAPID_EMAIL,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey,
      );
      console.log('Configuração VAPID realizada com sucesso');
      console.log('VAPID Email:', process.env.VAPID_EMAIL);
      console.log('VAPID Public Key:', this.vapidKeys.publicKey);
    } catch (error) {
      console.error('Erro ao configurar VAPID:', error);
    }
  }

  getVapidPublicKey(): string {
    if (!this.vapidKeys.publicKey) {
      throw new Error('VAPID public key não configurada');
    }
    return this.vapidKeys.publicKey;
  }

  async saveSubscription(
    userId: number,
    subscription: webPush.PushSubscription,
  ): Promise<PushSubscription> {
    console.log('Salvando subscription para usuário:', userId);
    console.log('Subscription recebida:', subscription);

    try {
      // Salvar a inscrição no banco de dados
      const result = await this.prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
      console.log('Subscription salva com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
      throw error;
    }
  }

  async sendNotification(
    subscription: webPush.PushSubscription,
    payload: any,
  ): Promise<boolean> {
    try {
      console.log('Enviando notificação para:', subscription.endpoint);
      console.log('Payload:', payload);
      
      await webPush.sendNotification(subscription, JSON.stringify(payload));
      console.log('Notificação enviada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  }

  async sendNotificationToUser(userId: number, payload: any): Promise<boolean> {
    console.log('Enviando notificação para usuário:', userId);
    
    const dbSubscription = await this.prisma.pushSubscription.findFirst({
      where: { userId },
    });

    if (!dbSubscription) {
      console.log('Nenhuma subscription encontrada para o usuário:', userId);
      return false;
    }

    const subscription: webPush.PushSubscription = {
      endpoint: dbSubscription.endpoint,
      keys: {
        p256dh: dbSubscription.p256dh,
        auth: dbSubscription.auth,
      },
    };

    return this.sendNotification(subscription, payload);
  }

  async removeSubscription(userId: number) {
    return await this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }
}
