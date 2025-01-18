import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ReceivePayloadApiDto } from './dto/payload-api.dto';

@Injectable()
export class SMSProducer {
  constructor(@InjectQueue('sms-queue') private readonly smsQueue: Queue) {}

  private async addToQueue(
    jobName: string,
    data: ReceivePayloadApiDto,
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

  async sendSms(data: ReceivePayloadApiDto) {
    return this.addToQueue('send-sms', data);
  }
}
