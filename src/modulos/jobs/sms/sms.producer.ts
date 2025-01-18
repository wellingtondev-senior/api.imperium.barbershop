import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  AppointmentConfirmationDto,
  AppointmentReminderDto,
  AppointmentCancellationDto,
  PromotionalMessageDto,
} from './dto/sms.dto';

@Injectable()
export class SMSProducer {
  constructor(@InjectQueue('sms-queue') private readonly smsQueue: Queue) {}

  private async addToQueue<T>(
    jobName: string,
    data: T,
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      await this.smsQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      });

      return {
        success: true,
        message: 'SMS added to queue successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error adding SMS to queue',
        error: error.message,
      };
    }
  }

  async sendAppointmentConfirmation(data: AppointmentConfirmationDto) {
    return this.addToQueue('appointment-confirmation', data);
  }

  async sendAppointmentReminder(data: AppointmentReminderDto) {
    return this.addToQueue('appointment-reminder', data);
  }

  async sendAppointmentCancellation(data: AppointmentCancellationDto) {
    return this.addToQueue('appointment-cancellation', data);
  }

  async sendPromotionalMessage(data: PromotionalMessageDto) {
    return this.addToQueue('promotional-message', data);
  }
}
