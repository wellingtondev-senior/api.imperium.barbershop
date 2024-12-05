import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Prisma } from '@prisma/client';

type WebhookEventHandlers = {
  [key: string]: (data: any) => Promise<void>;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  constructor(private readonly prismaService: PrismaService) {}

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const eventType = payload.type;
      const eventData = payload.data.object;

      const handlers: WebhookEventHandlers = {
        'payment_intent.succeeded': this.handlePaymentSucceeded.bind(this),
        'payment_intent.requires_payment_method': this.handlePaymentFailed.bind(this),
        'payment_intent.canceled': this.handlePaymentCanceled.bind(this),
        'refund.failed': this.handleRefundFailed.bind(this),
        'charge.refund.updated': this.handleRefundUpdated.bind(this),
        'refund.updated': this.handleRefundStatusUpdated.bind(this),
        // Adicione mais handlers conforme necessário
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

  private async handlePaymentSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      await this.updatePaymentStatus(paymentIntent.id, {
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

      this.logger.log(`Pagamento bem-sucedido para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento bem-sucedido: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento bem-sucedido');
    }
  }

  private async handlePaymentFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      await this.updatePaymentStatus(paymentIntent.id, {
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

      this.logger.warn(`Pagamento falhou para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento falho: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento falho');
    }
  }

  private async handlePaymentCanceled(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      await this.updatePaymentStatus(paymentIntent.id, {
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

      this.logger.log(`Pagamento cancelado para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento cancelado: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento cancelado');
    }
  }

  private async handleRefundFailed(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updatePaymentStatus(refund.payment_intent, {
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

      this.logger.error(`Reembolso falhou para o pagamento ID ${refund.payment_intent}. Motivo: ${refund.failure_reason}`);
    } catch (error) {
      this.logger.error(`Erro ao processar falha no reembolso: ${error.message}`);
      throw new BadRequestException('Falha ao processar reembolso falho');
    }
  }

  private async handleRefundUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updatePaymentStatus(refund.payment_intent, {
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

      this.logger.log(`Reembolso atualizado para o pagamento ID ${refund.payment_intent}. Status: ${refund.status}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do reembolso: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar status do reembolso');
    }
  }

  private async handleRefundStatusUpdated(payload: WebhookPayloadDto): Promise<void> {
    try {
      const refund = payload.data.object;
      await this.updatePaymentStatus(refund.payment_intent, {
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

  private async updatePaymentStatus(paymentId: string, paymentData: Prisma.PaymentUpdateInput): Promise<void> {
    const existingPayment = await this.prismaService.payment.findUnique({
      where: { id: paymentId }
    });

    if (!existingPayment) {
      this.logger.error(`Pagamento não encontrado para o ID ${paymentId}`);
      throw new BadRequestException('Pagamento não encontrado');
    }

    await this.prismaService.payment.update({
      where: { id: paymentId },
      data: paymentData,
    });
  }
}
