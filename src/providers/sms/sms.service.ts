import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import SMSDto from './dto/sms.dto';

@Injectable()
export class SmsService {
    constructor(
        @InjectQueue('sms-queue') private readonly smsQueue: Queue,
    ) {}

    async sendSms(data: SMSDto) {
        try {
            const { to, message } = data;
          
            await this.smsQueue.add('sms-payment', {
                to,
                message
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
            });

            return {
                success: true,
                message: 'SMS adicionado à fila com sucesso',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Erro ao adicionar SMS à fila',
                error: error.message,
            };
        }
    }
}
