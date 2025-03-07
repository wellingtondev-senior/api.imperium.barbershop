import { Injectable, OnModuleInit } from '@nestjs/common';
import * as webPush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class WebPushService implements OnModuleInit {
  private vapidKeys: { publicKey: string; privateKey: string };

  constructor(private prismaService: PrismaService) {
    // Gerar novas chaves VAPID se não existirem

    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };

  }

  onModuleInit() {
    if (!process.env.VAPID_EMAIL) {
      return;
    }

    try {
      webPush.setVapidDetails(
        process.env.URL_FRONTEND,
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
    role: Role,
    id: number,
    subscription: webPush.PushSubscription,
  ) {
    switch (role) {
      case Role.ADM:
        try {
          // Usar upsert para criar ou atualizar a subscription
          const result = await this.prismaService.pushSubscriptionADM.upsert({
            where: { admId: id },
            create: {
              admId: id,
              role,
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              active: true
            },
            update: {
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              active: true,
              update_at: new Date()
            },
          });

          console.log('Subscription salva/atualizada com sucesso:', result);
          return result;
        } catch (error) {
          console.error('Erro ao salvar subscription:', error);
          throw error;
        }
      case Role.PROFESSIONAL:
        try {
          // Usar upsert para criar ou atualizar a subscription
          const result = await this.prismaService.pushSubscription.upsert({
            where: { professionalId: id },
            create: {
              professionalId: id,
              role,
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              active: true
            },
            update: {
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              active: true,
              update_at: new Date()
            },
          });

          console.log('Subscription salva/atualizada com sucesso:', result);
          return result;
        } catch (error) {
          console.error('Erro ao salvar subscription:', error);
          throw error;
        }


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

  async sendNotificationToUserADM(payload: any): Promise<boolean> {
    console.log('Enviando notificação para usuário:');

    const dbSubscription = await this.prismaService.pushSubscription.findFirst({
      where: { role: Role.ADM },
    });

    if (!dbSubscription) {
      console.log('Nenhuma subscription encontrada para o usuário:');
      return false;
    }

    // Converter subscription do banco para o formato do web-push
    const subscription: webPush.PushSubscription = {
      endpoint: dbSubscription.endpoint,
      keys: {
        p256dh: dbSubscription.p256dh,
        auth: dbSubscription.auth,
      },
    };

    return this.sendNotification(subscription, payload);
  }

  async sendNotificationToUser(professionalId: number, payload: any): Promise<boolean> {
    console.log('Enviando notificação para usuário:', professionalId);

    const dbSubscription = await this.prismaService.pushSubscription.findFirst({
      where: { professionalId },
    });

    if (!dbSubscription) {
      console.log('Nenhuma subscription encontrada para o usuário:', professionalId);
      return false;
    }

    // Converter subscription do banco para o formato do web-push
    const subscription: webPush.PushSubscription = {
      endpoint: dbSubscription.endpoint,
      keys: {
        p256dh: dbSubscription.p256dh,
        auth: dbSubscription.auth,
      },
    };

    return this.sendNotification(subscription, payload);
  }

  async removeSubscription(id: number, role: Role) {
    switch (role) {
      case Role.ADM:
        return await this.prismaService.pushSubscriptionADM.deleteMany({
          where: { admId: id },
        });
      case Role.PROFESSIONAL:
        return await this.prismaService.pushSubscription.deleteMany({
          where: { professionalId: id },
        });
      default:
        throw new Error('Role inválida');
    }
  }

}