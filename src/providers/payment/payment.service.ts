import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
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

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const eventType = payload.type;
      const eventData = payload.data.object;

      // Primeiro, criar ou atualizar o pagamento
      await this.updateOrCreatePayment(eventData.id, {
        id: eventData.id,
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        amount: eventData.amount,
        currency: eventData.currency,
        status: eventData.status,
        payment_method: eventData.payment_method,
        client_secret: eventData.client_secret,
        update_at: new Date()
      });

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
        this.logger.warn(`Status de pagamento não tratado: ${eventType}`);
        return { received: true };
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw new BadRequestException('Falha ao processar webhook');
    }
  }

  private async updateOrCreatePayment(paymentId: string, paymentData: any): Promise<void> {
    try {
      const existingPayment = await this.prismaService.payment.findUnique({
        where: { id: paymentId }
      });

      if (existingPayment) {
        await this.prismaService.payment.update({
          where: { id: paymentId },
          data: paymentData,
        });
      } else {
        await this.prismaService.payment.create({
          data: paymentData,
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao atualizar/criar pagamento: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar/criar pagamento');
    }
  }

  private async handlePaymentSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      await this.updateOrCreatePayment(paymentIntent.id, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method,
        client_secret: paymentIntent.client_secret,
        update_at: new Date()
      });

      // Buscar e atualizar o agendamento após garantir que o pagamento existe
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

        const servicesNames = schedule.services.map(service => service.name).join(', ');
        const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

        const message = `Hello ${schedule.client.cardName}!\n` +
          `Your payment for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
          `at ${schedule.time} has been successful!\n` +
          `Services: ${servicesNames}\n` +
          `Total Value: U$ ${totalValue.toFixed(2)}\n\n` +
          `View your appointment details at: ${process.env.URL_FRONTEND}/schedule/confirmation/${paymentIntent.id}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          message: message
        });

        this.logger.log(`Agendamento ${schedule.id} confirmado e SMS enviado`);
      }

      this.logger.log(`Pagamento bem-sucedido para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento bem-sucedido: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento bem-sucedido');
    }
  }

  private async handlePaymentFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      
      // Atualizar status do pagamento
      await this.updateOrCreatePayment(paymentIntent.id, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: paymentIntent.status,
        update_at: new Date()
      });

      // Buscar e atualizar o agendamento associado
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

        // Send SMS notification about payment failure
        const servicesNames = schedule.services.map(service => service.name).join(', ');
        const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

        const message = `Hello ${schedule.client.cardName}!\n` +
          `Your payment for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
          `at ${schedule.time} has failed.\n` +
          `Services: ${servicesNames}\n` +
          `Total Value: U$ ${totalValue.toFixed(2)}\n\n` +
          `Please update your payment method at: ${process.env.URL_FRONTEND}/schedule/confirmation/${paymentIntent.id}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          message: message
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
      }

      this.logger.warn(`Pagamento falhou para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento falho: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento falho');
    }
  }

  private async handlePaymentCanceled(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      await this.updateOrCreatePayment(paymentIntent.id, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: paymentIntent.status,
        update_at: new Date()
      });
           // Buscar e atualizar o agendamento associado
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

        // Send SMS notification about payment failure
        const servicesNames = schedule.services.map(service => service.name).join(', ');
        const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

        const message = `Hello ${schedule.client.cardName}!\n` +
          `Your payment for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
          `at ${schedule.time} has been cancelled.\n` +
          `Services: ${servicesNames}\n` +
          `Total Value: U$ ${totalValue.toFixed(2)}\n\n` +
          `You can retry your payment at: ${process.env.URL_FRONTEND}/schedule/confirmation/${paymentIntent.id}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          message: message
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
      }
      this.logger.log(`Pagamento cancelado para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento cancelado: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento cancelado');
    }
  }

  private async handleRefundFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updateOrCreatePayment(refund.payment_intent, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: {
          ...payload.data,
          refund_status: refund.status,
          refund_reason: refund.failure_reason
        },
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: 'refund_failed',
        update_at: new Date()
      });
           // Buscar e atualizar o agendamento associado
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

        // Send SMS notification about payment failure
        const servicesNames = schedule.services.map(service => service.name).join(', ');
        const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

        const message = `Hello ${schedule.client.cardName}!\n` +
          `Your refund request for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
          `at ${schedule.time} has failed.\n` +
          `Services: ${servicesNames}\n` +
          `Refund Amount: U$ ${totalValue.toFixed(2)}\n\n` +
          `Check your refund status at: ${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          message: message
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
      }
      this.logger.error(`Reembolso falhou para o pagamento ID ${refund.payment_intent}. Motivo: ${refund.failure_reason}`);
    } catch (error) {
      this.logger.error(`Erro ao processar falha no reembolso: ${error.message}`);
      throw new BadRequestException('Falha ao processar reembolso falho');
    }
  }

  private async handleRefundUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updateOrCreatePayment(refund.payment_intent, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: {
          ...payload.data,
          refund_status: refund.status,
          refund_amount: refund.amount
        },
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: 'refunded',
        update_at: new Date()
      });
          // Buscar e atualizar o agendamento associado
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
    
            // Send SMS notification about payment failure
            const servicesNames = schedule.services.map(service => service.name).join(', ');
            const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);
    
            const message = `Hello ${schedule.client.cardName}!\n` +
              `Your refund for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
              `at ${schedule.time} has been processed.\n` +
              `Services: ${servicesNames}\n` +
              `Refund Amount: U$ ${totalValue.toFixed(2)}\n\n` +
              `View your refund details at: ${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;
    
            await this.smsService.sendSms({
              to: schedule.client.phoneCountry,
              message: message
            });
    
            this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
          }

      this.logger.log(`Reembolso atualizado para o pagamento ID ${refund.payment_intent}. Status: ${refund.status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do reembolso: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar status do reembolso');
    }
  }

  private async handleRefundStatusUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updateOrCreatePayment(refund.payment_intent, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: {
          ...payload.data,
          refund_status: refund.status,
          refund_amount: refund.amount,
          refund_metadata: refund.metadata,
          last_refund_update: new Date().toISOString()
        },
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: this.getRefundStatus(refund.status),
        update_at: new Date()
      });
    // Buscar e atualizar o agendamento associado
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

      // Send SMS notification about payment failure
      const servicesNames = schedule.services.map(service => service.name).join(', ');
      const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

      const message = `Hello ${schedule.client.cardName}!\n` +
        `Your refund status for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
        `at ${schedule.time} has been updated.\n` +
        `Services: ${servicesNames}\n` +
        `Refund Amount: U$ ${totalValue.toFixed(2)}\n\n` +
        `Check your refund status at: ${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;

      await this.smsService.sendSms({
        to: schedule.client.phoneCountry,
        message: message
      });

      this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
    }
      this.logger.log(`Status do reembolso atualizado para o pagamento ID ${refund.payment_intent}. Novo status: ${refund.status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do reembolso: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar status do reembolso');
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
      await this.updateOrCreatePayment(charge.payment_intent, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: {
          ...payload.data,
          charge_id: charge.id,
          charge_status: charge.status,
          charge_amount: charge.amount,
          payment_method_details: charge.payment_method_details
        },
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: 'succeeded',
        update_at: new Date()
      });
      
    // Buscar e atualizar o agendamento associado
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

      // Send SMS notification about payment failure
      const servicesNames = schedule.services.map(service => service.name).join(', ');
      const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

      const message = `Hello ${schedule.client.cardName}!\n` +
        `Your payment for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
        `at ${schedule.time} has been successful!\n` +
        `Services: ${servicesNames}\n` +
        `Total Value: U$ ${totalValue.toFixed(2)}\n\n` +
        `View your appointment details at: ${process.env.URL_FRONTEND}/schedule/confirmation/${charge.payment_intent}`;

      await this.smsService.sendSms({
        to: schedule.client.phoneCountry,
        message: message
      });

      this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
    }

      this.logger.log(`Cobrança bem-sucedida para o pagamento ID ${charge.payment_intent}`);
    } catch (error) {
      this.logger.error(`Erro ao processar cobrança bem-sucedida: ${error.message}`);
      throw new BadRequestException('Falha ao processar cobrança bem-sucedida');
    }
  }

  private async handleChargeUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const charge = payload.data.object;
      await this.updateOrCreatePayment(charge.payment_intent, {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: {
          ...payload.data,
          charge_id: charge.id,
          charge_status: charge.status,
          charge_amount: charge.amount,
          payment_method_details: charge.payment_method_details,
          last_charge_update: new Date().toISOString()
        },
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        status: charge.status,
        update_at: new Date()
      });
    // Buscar e atualizar o agendamento associado
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

      // Send SMS notification about payment failure
      const servicesNames = schedule.services.map(service => service.name).join(', ');
      const totalValue = schedule.services.reduce((sum, service) => sum + service.price, 0);

      const message = `Hello ${schedule.client.cardName}!\n` +
        `Your payment status for the appointment on ${new Date(schedule.dateTime).toLocaleDateString()} ` +
        `at ${schedule.time} has been updated.\n` +
        `Services: ${servicesNames}\n` +
        `Total Value: U$ ${totalValue.toFixed(2)}\n\n` +
        `Check your payment status at: ${process.env.URL_FRONTEND}/schedule/confirmation/${charge.payment_intent}`;

      await this.smsService.sendSms({
        to: schedule.client.phoneCountry,
        message: message
      });

      this.logger.log(`Agendamento ${schedule.id} cancelado devido à falha no pagamento e SMS enviado`);
    }

      this.logger.log(`Status da cobrança atualizado para o pagamento ID ${charge.payment_intent}. Novo status: ${charge.status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status da cobrança: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar status da cobrança');
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
