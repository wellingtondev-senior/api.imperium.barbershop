import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SMSProducer } from 'src/modulos/jobs/sms/sms.producer';
import { AppointmentDataDto } from './dto/sms.payload.dto';
import { format } from 'date-fns';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly smsProducer: SMSProducer) { }

  private formatAppointmentMessage(data: AppointmentDataDto): string {
    const { client, service, appointmentDate, barberName, link } = data;

    const services = service.map(item =>
      `${item.name}: $${item.price.toFixed(2)}`
    ).join('\n');

    const total = service.reduce((sum, item) => sum + item.price, 0);

    const formattedDate = appointmentDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let message = `Hello ${client}!\n\n`;
    message += `Your appointment has been scheduled for ${formattedDate} with ${barberName}.\n\n`;
    message += `Services:\n${services}\n\n`;
    message += `Total: $${total.toFixed(2)}`;

    if (link) {
      message += `\n\nView your appointment details at: ${link}`;
    }

    return message;
  }

  private formatProfessionalAppointmentMessage(data: AppointmentDataDto): string {
    const { client, service, appointmentDate, additionalMessage } = data;

    const totalValue = service.reduce((acc, item) => acc + item.price, 0);
    const services = service.map(item => item.name).join(', ');
    const formattedDate = format(new Date(appointmentDate), 'dd/MM/yyyy HH:mm');

    let message = `Novo agendamento!\n\n`;
    message += `Cliente: ${client}\n`;
    message += `Data: ${formattedDate}\n`;
    message += `Serviços: ${services}\n`;
    message += `Valor Total: $${totalValue.toFixed(2)}`;

    if (additionalMessage) {
      message += `\n\nStatus:\n${additionalMessage}`;
    }

    return message;
  }

  async sendAppointmentMessage(data: AppointmentDataDto, isProfessional: boolean = false) {
    try {
      const message = isProfessional 
        ? this.formatProfessionalAppointmentMessage(data)
        : this.formatAppointmentMessage(data);

      const result = await this.smsProducer.sendSms({
        to: data.to,
        message
      });

      if (result.success) {
        this.logger.log(result.message);

        return {
          statusCode: HttpStatus.CREATED,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Failed to send SMS');
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`);
      throw error;
    }
  }
}
