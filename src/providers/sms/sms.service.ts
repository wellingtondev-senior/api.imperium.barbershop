import { Injectable } from '@nestjs/common';
import { TwilioProducer } from 'src/modulos/jobs/twilio/twilio.producer';
import { ReceivePayloadApiDto } from 'src/modulos/jobs/twilio/dto/payload-api.dto';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';

@Injectable()
export class SmsService {
    private readonly className = this.constructor.name;
    constructor(
        private readonly twilioProducer: TwilioProducer,
        private readonly loggerService: LoggerCustomService
    ) {}

    async sendSms(receivePayloadApiDto: ReceivePayloadApiDto) {
        try {
            await this.twilioProducer.sendSmsPayment(receivePayloadApiDto);
            this.loggerService.warn({
                className: this.className,
                functionName: 'sendSms',
                message: `Enviado sms  com sucesso para ${receivePayloadApiDto.to}`,
              });
        
            return {
                success: true,
                message: 'SMS adicionado à fila com sucesso',
            };
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'sendSms',
                message: `Erro ao envoiar sms para ${receivePayloadApiDto.to}`,
              });
            throw new Error(`Erro ao enviar SMS: ${error.message}`);
        }
    }
}
