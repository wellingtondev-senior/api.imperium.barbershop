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
  private readonly link = `${process.env.URL_FRONTEND}/schedule/confirmation`;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const eventType = payload.type;
      const eventData = payload.data.object;

      // Primeiro, criar ou atualizar o pagamento
      const updated = await this.updatePayment(eventData);

      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
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
        this.logger.warn(`Status de pagamento não tratado: ${eventType}`);
        return { received: true };
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw new BadRequestException('Falha ao processar webhook');
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
      this.logger.error('Erro ao atualizar pagamento: ', error);
      return false;
    }
  }

  private async handlePaymentSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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


        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: `${this.link}/${paymentIntent.id}`
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
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${paymentIntent.id}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
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
      const updated = await this.updatePayment(paymentIntent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${paymentIntent.id}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
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
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado e SMS enviado`);
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
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado e SMS enviado`);
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
      const updated = await this.updatePayment(refund.payment_intent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${refund.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
        });

        this.logger.log(`Agendamento ${schedule.id} cancelado e SMS enviado`);
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
      const updated = await this.updatePayment(charge.payment_intent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${charge.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
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
      const updated = await this.updatePayment(charge.payment_intent);
      
      if (!updated) {
        throw new Error('Falha ao atualizar pagamento');
      }

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

        const link = `${process.env.URL_FRONTEND}/schedule/confirmation/${charge.payment_intent}`;

        await this.smsService.sendSms({
          to: schedule.client.phoneCountry,
          client: schedule.client.cardName,
          service: schedule.services.map(service => ({
            name: service.name,
            price: service.price
          })),
          link: link
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
