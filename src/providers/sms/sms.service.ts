import { Injectable } from '@nestjs/common';
import { TwilioProducer } from 'src/modulos/jobs/twilio/twilio.producer';
import { ReceivePayloadApiDto } from 'src/modulos/jobs/twilio/dto/payload-api.dto';

@Injectable()
export class SmsService {
    constructor(
        private readonly twilioProducer: TwilioProducer,
    ) {}

    async sendSms(data: ReceivePayloadApiDto) {
        try {
            await this.twilioProducer.sendSmsPayment(data);
            return {
                success: true,
                message: 'SMS adicionado à fila com sucesso',
            };
        } catch (error) {
            throw new Error(`Erro ao enviar SMS: ${error.message}`);
        }
    }
}
