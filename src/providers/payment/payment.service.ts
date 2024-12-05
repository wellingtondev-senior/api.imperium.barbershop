import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  constructor(private readonly prismaService: PrismaService) {}

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const paymentIntent = payload.data.object;
      
      switch (paymentIntent.status) {
        case 'succeeded':
          await this.handlePaymentSucceeded(payload);
          break;
        case 'requires_payment_method':
          await this.handlePaymentFailed(payload);
          break;
        case 'canceled':
          await this.handlePaymentCanceled(payload);
          break;
        default:
          this.logger.warn(`Status de pagamento não tratado: ${paymentIntent.status}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw new BadRequestException('Falha ao processar webhook');
    }
  }

  private async handlePaymentSucceeded(payload: WebhookPayloadDto): Promise<void> {
    try {
      const paymentIntent = payload.data.object;
      
      // Verificar se o pagamento existe
      const existingPayment = await this.prismaService.payment.findUnique({
        where: { id: paymentIntent.id }
      });

      if (!existingPayment) {
        this.logger.error(`Pagamento não encontrado para o ID ${paymentIntent.id}`);
        throw new BadRequestException('Pagamento não encontrado');
      }

      const paymentData: Prisma.PaymentUpdateInput = {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        // Campos extraídos do data.object para facilitar consultas
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method: paymentIntent.payment_method,
        client_secret: paymentIntent.client_secret,
        update_at: new Date()
      };

      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: paymentData,
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

      // Verificar se o pagamento existe
      const existingPayment = await this.prismaService.payment.findUnique({
        where: { id: paymentIntent.id }
      });

      if (!existingPayment) {
        this.logger.error(`Pagamento não encontrado para o ID ${paymentIntent.id}`);
        throw new BadRequestException('Pagamento não encontrado');
      }

      const paymentData: Prisma.PaymentUpdateInput = {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        // Campos extraídos do data.object para facilitar consultas
        status: paymentIntent.status,
        update_at: new Date()
      };

      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: paymentData,
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

      // Verificar se o pagamento existe
      const existingPayment = await this.prismaService.payment.findUnique({
        where: { id: paymentIntent.id }
      });

      if (!existingPayment) {
        this.logger.error(`Pagamento não encontrado para o ID ${paymentIntent.id}`);
        throw new BadRequestException('Pagamento não encontrado');
      }

      const paymentData: Prisma.PaymentUpdateInput = {
        object: payload.object,
        type: payload.type,
        api_version: payload.api_version,
        created: payload.created,
        data: payload.data,
        livemode: payload.livemode,
        pending_webhooks: payload.pending_webhooks,
        request: payload.request,
        // Campos extraídos do data.object para facilitar consultas
        status: paymentIntent.status,
        update_at: new Date()
      };

      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: paymentData,
      });

      this.logger.log(`Pagamento cancelado para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento cancelado: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento cancelado');
    }
  }
}
