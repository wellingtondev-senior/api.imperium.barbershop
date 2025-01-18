import { Injectable, Logger } from '@nestjs/common';
import { SMSProducer } from 'src/modulos/jobs/sms/sms.producer';
import { AppointmentDataDto } from './dto/sms.payload.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly smsProducer: SMSProducer) {}

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

  async sendAppointmentMessage(data: AppointmentDataDto) {
    try {
      const message = this.formatAppointmentMessage(data);
      
      const result = await this.smsProducer.sendSms({
        to: data.to,
        message
      });

      if (result.success) {
        this.logger.log(`SMS sent successfully to ${data.to}`);
        return { success: true, message: 'SMS sent successfully' };
      } else {
        throw new Error(result.message || 'Failed to send SMS');
      }
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`);
      throw error;
    }
  }
}
