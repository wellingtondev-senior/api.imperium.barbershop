import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ReceivePayloadApiDto } from './dto/payload-api.dto';

@Injectable()
export class SMSProducer {
    constructor(
        @InjectQueue('sms-queue') private readonly smsQueue: Queue,
    ) {}

    async sendSmsPayment({to, message}: {to:string, message:string}) {
        try {
            await this.smsQueue.add('sms-payment', {to, message}, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000, // 1 segundo
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
