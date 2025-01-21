import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { firebaseConfig } from './firebase';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor() {
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  }

  onModuleInit() {
    console.log('Firebase Admin inicializado com sucesso');
  }

  async sendNotification(token: string, title: string, body: string) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        token,
      };

      const response = await getMessaging().send(message);
      console.log('Notificação enviada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  async sendMulticastNotification(tokens: string[], title: string, body: string) {
    try {
      const messages = tokens.map(token => ({
        notification: {
          title,
          body,
        },
        token,
      }));

      const response = await getMessaging().sendEach(messages);
      console.log('Notificações enviadas:', response);
      return response;
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      throw error;
    }
  }
}
