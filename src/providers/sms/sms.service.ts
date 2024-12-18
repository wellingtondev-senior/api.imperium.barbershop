import { Injectable } from '@nestjs/common';
import { ReceivePayloadApiDto } from 'src/modulos/jobs/sms/dto/payload-api.dto';
import { SMSProducer } from 'src/modulos/jobs/sms/sms.producer';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';

@Injectable()
export class SmsService {
    private readonly className = this.constructor.name;
    constructor(
        private readonly smsProducer: SMSProducer,
        private readonly loggerService: LoggerCustomService
    ) {}

    async sendSmsResponse(to: string, message: string) {
        try {
            await this.smsProducer.sendSmsPayment({
                to: to,
                message: message,
            });
            this.loggerService.warn({
                className: this.className,
                functionName: 'sendSms',
                message: `Enviado sms  com sucesso para ${to}`,
              });
        
            return {
                success: true,
                message: 'SMS adicionado à fila com sucesso',
            };
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'sendSms',
                message: `Erro ao envoiar sms para ${to}`,
              });
            throw new Error(`Erro ao enviar SMS: ${error.message}`);
        }
    }
    async sendSms(receivePayloadApiDto:ReceivePayloadApiDto) {
        const {to} = receivePayloadApiDto
        try {
           let message = `Hello ${receivePayloadApiDto.client}!\n\n`;
           message += `Your appointment has been confirmed \n`;
            message += `Services:\n`;
           
            let total = 0;
           receivePayloadApiDto.service.forEach(service => {
               message += ` ${service.name}: $ ${service.price.toFixed(2)}\n`;
           total += service.price;
           });
           
           message += `\n Total: $ ${total.toFixed(2)}\n\n`;
           message += `To view your appointment details, please visit:\n`;
           message += `${receivePayloadApiDto.link}`;

            await this.smsProducer.sendSmsPayment({
                to: to,
                message: message,
            });
            this.loggerService.warn({
                className: this.className,
                functionName: 'sendSms',
                message: `Enviado sms  com sucesso para ${to}`,
              });
        
            return {
                success: true,
                message: 'SMS adicionado à fila com sucesso',
            };
        } catch (error) {
            this.loggerService.error({
                className: this.className,
                functionName: 'sendSms',
                message: `Erro ao envoiar sms para ${to}`,
              });
            throw new Error(`Erro ao enviar SMS: ${error.message}`);
        }
    }
}
