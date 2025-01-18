import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Prisma } from '@prisma/client';
import { SmsService } from '../sms/sms.service';

type WebhookEventHandlers = {
  [key: string]: (data: any) => Promise<void>;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  private readonly link = `${process.env.URL_FRONTEND}/schedule/confirmation`;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  private formatPaymentMessage(schedule: any, paymentId: string): string {
    const services = schedule.services.map((service: any) => 
      `${service.name}: $${service.price.toFixed(2)}`
    ).join('\n');

    const total = schedule.services.reduce((sum: number, service: any) => 
      sum + service.price, 0
    );

    return `Hello ${schedule.client.cardName}!\n\n` +
           `Your appointment has been ${schedule.status === 'confirmed' ? 'confirmed' : 'updated'}.\n\n` +
           `Services:\n${services}\n\n` +
           `Total: $${total.toFixed(2)}\n\n` +
           `To view your appointment details, visit:\n` +
           `${this.link}/${paymentId}`;
  }

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const eventType = payload.type;
      const eventData = payload.data.object;

      const updated = await this.updatePayment(eventData);

      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const handlers: WebhookEventHandlers = {
        'payment_intent.succeeded': this.handlePaymentSucceeded.bind(this),
        'payment_intent.requires_payment_method': this.handlePaymentFailed.bind(this),
        'payment_intent.canceled': this.handlePaymentCanceled.bind(this),
        'refund.failed': this.handleRefundFailed.bind(this),
        'charge.refund.updated': this.handleRefundUpdated.bind(this),
        'refund.updated': this.handleRefundStatusUpdated.bind(this),
        'charge.succeeded': this.handleChargeSucceeded.bind(this),
        'charge.updated': this.handleChargeUpdated.bind(this),
      };

      const handler = handlers[eventType];
      if (handler) {
        await handler(payload);
        return { received: true };
      } else {
        this.logger.warn(`Unhandled payment status: ${eventType}`);
        return { received: true };
      }
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw new BadRequestException('Failed to process webhook');
    }
  }

  async updatePayment(eventData: any): Promise<boolean> {
    try {
      const { data, type, api_version, created, livemode, pending_webhooks, request } = eventData;
      const { charge_id, charge_status, charge_amount, payment_method_details } = data;
      const billingDetails = data.object?.billing_details;

      let clientData = undefined;

      if (billingDetails) {
        const existingClient = await this.prismaService.client.findFirst({
          where: { email: billingDetails.email }
        });

        if (existingClient) {
          clientData = { connect: { id: existingClient.id } };
        } else if (billingDetails.email && billingDetails.name) {
          clientData = {
            create: {
              email: billingDetails.email,
              cardName: billingDetails.name,
              phoneCountry: billingDetails.phone || ''
            }
          };
        }
      }

      const paymentData = {
        id: charge_id,
        object: data.object,
        type,
        api_version,
        created,
        data,
        livemode,
        pending_webhooks,
        request,
        status: charge_status,
        amount: charge_amount,
        client: clientData
      };

      await this.prismaService.payment.update({
        where: { id: charge_id },
        data: paymentData
      });

      return true;
    } catch (error) {
      this.logger.error('Error updating payment: ', error);
      return false;
    }
  }

  private async sendScheduleNotification(schedule: any, paymentId: string): Promise<void> {
    if (schedule?.client?.phoneCountry) {
      await this.smsService.sendAppointmentMessage({
        to: schedule.client.phoneCountry,
        client: schedule.client.cardName,
        service: schedule.services.map(service => ({
          name: service.name,
          price: service.price
        })),
        appointmentDate: schedule.date,
        barberName: schedule.professional.name,
        link: `${this.link}/${paymentId}`
      });

      this.logger.log(`SMS sent to ${schedule.client.phoneCountry} for schedule ${schedule.id}`);
    }
  }

  private async handlePaymentSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: paymentIntent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'confirmed' }
        });

        await this.sendScheduleNotification(schedule, paymentIntent.id);
        this.logger.log(`Schedule ${schedule.id} confirmed and SMS sent`);
      }

      this.logger.log(`Payment successful for ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Error updating successful payment: ${error.message}`);
      throw new BadRequestException('Failed to process successful payment');
    }
  }

  private async handlePaymentFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: paymentIntent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, paymentIntent.id);
        this.logger.log(`Schedule ${schedule.id} canceled due to payment failure and SMS sent`);
      }

      this.logger.warn(`Payment failed for ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Error updating failed payment: ${error.message}`);
      throw new BadRequestException('Failed to process failed payment');
    }
  }

  private async handlePaymentCanceled(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: paymentIntent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, paymentIntent.id);
        this.logger.log(`Schedule ${schedule.id} canceled and SMS sent`);
      }

      this.logger.log(`Payment canceled for ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Error updating canceled payment: ${error.message}`);
      throw new BadRequestException('Failed to process canceled payment');
    }
  }

  private async handleRefundFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: refund.payment_intent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, refund.payment_intent);
        this.logger.log(`Schedule ${schedule.id} canceled and SMS sent`);
      }

      this.logger.error(`Refund failed for payment ID ${refund.payment_intent}. Reason: ${refund.failure_reason}`);
    } catch (error) {
      this.logger.error(`Error processing refund failure: ${error.message}`);
      throw new BadRequestException('Failed to process refund failure');
    }
  }

  private async handleRefundUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: refund.payment_intent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, refund.payment_intent);
        this.logger.log(`Schedule ${schedule.id} canceled and SMS sent`);
      }

      this.logger.log(`Refund updated for payment ID ${refund.payment_intent}. Status: ${refund.status}`);
    } catch (error) {
      this.logger.error(`Error updating refund status: ${error.message}`);
      throw new BadRequestException('Failed to update refund status');
    }
  }

  private async handleRefundStatusUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: refund.payment_intent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, refund.payment_intent);
        this.logger.log(`Schedule ${schedule.id} canceled and SMS sent`);
      }

      this.logger.log(`Refund status updated for payment ID ${refund.payment_intent}. New status: ${refund.status}`);
    } catch (error) {
      this.logger.error(`Error updating refund status: ${error.message}`);
      throw new BadRequestException('Failed to update refund status');
    }
  }

  private getRefundStatus(refundStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'succeeded': 'refunded',
      'pending': 'refund_pending',
      'failed': 'refund_failed',
      'canceled': 'refund_canceled'
    };

    return statusMap[refundStatus] || 'refund_unknown';
  }

  private async handleChargeSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const charge = payload.data.object;
      const updated = await this.updatePayment(charge.payment_intent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: charge.payment_intent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'pending' }
        });

        await this.sendScheduleNotification(schedule, charge.payment_intent);
        this.logger.log(`Schedule ${schedule.id} updated to pending and SMS sent`);
      }

      this.logger.log(`Charge successful for payment ID ${charge.payment_intent}`);
    } catch (error) {
      this.logger.error(`Error processing successful charge: ${error.message}`);
      throw new BadRequestException('Failed to process successful charge');
    }
  }

  private async handleChargeUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const charge = payload.data.object;
      const updated = await this.updatePayment(charge.payment_intent);
      
      if (!updated) {
        throw new Error('Failed to update payment');
      }

      const schedule = await this.prismaService.schedule.findFirst({
        where: { paymentId: charge.payment_intent.id },
        include: {
          client: true,
          services: true,
          professional: true,
        }
      });

      if (schedule) {
        await this.prismaService.schedule.update({
          where: { id: schedule.id },
          data: { status: 'canceled' }
        });

        await this.sendScheduleNotification(schedule, charge.payment_intent);
        this.logger.log(`Schedule ${schedule.id} canceled and SMS sent`);
      }

      this.logger.log(`Charge status updated for payment ID ${charge.payment_intent}. New status: ${charge.status}`);
    } catch (error) {
      this.logger.error(`Error updating charge status: ${error.message}`);
      throw new BadRequestException('Failed to update charge status');
    }
  }

  async findAll(status?: string) {
    try {
      const query = this.prismaService.payment.findMany({
        where: status ? {
          status: status
        } : {},
        include: {
          schedule: {
            include: {
              client: true,
              professional: true,
              services: true
            }
          }
        }
      });

      const payments = await query;

      return {
        success: true,
        message: 'Payments retrieved successfully',
        data: payments
      };
    } catch (error) {
      throw new Error(`Failed to retrieve payments: ${error.message}`);
    }
  }
}
