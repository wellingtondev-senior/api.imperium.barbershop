import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  constructor(private readonly prismaService: PrismaService) {}

  async processWebhook(payload: WebhookPayloadDto) {
    try {
      const paymentIntent = payload.object;
      
      switch (paymentIntent.status) {
        case 'succeeded':
          await this.handlePaymentSucceeded(paymentIntent);
          break;
        case 'requires_payment_method':
          await this.handlePaymentFailed(paymentIntent);
          break;
        case 'canceled':
          await this.handlePaymentCanceled(paymentIntent);
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

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    try {
      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          payment_method_types: paymentIntent.payment_method_types,
          receipt_email: paymentIntent.receipt_email,
          shipping: paymentIntent.shipping,
          update_at: new Date()
        },
      });

      this.logger.log(`Pagamento bem-sucedido para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento bem-sucedido: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento bem-sucedido');
    }
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    try {
      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: {
          status: paymentIntent.status,
          last_payment_error: paymentIntent.last_payment_error,
          update_at: new Date()
        },
      });

      this.logger.warn(`Pagamento falhou para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento falho: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento falho');
    }
  }

  private async handlePaymentCanceled(paymentIntent: any): Promise<void> {
    try {
      await this.prismaService.payment.update({
        where: { id: paymentIntent.id },
        data: {
          status: paymentIntent.status,
          canceled_at: new Date(),
          cancellation_reason: paymentIntent.cancellation_reason,
          update_at: new Date()
        },
      });

      this.logger.log(`Pagamento cancelado para o ID ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento cancelado: ${error.message}`);
      throw new BadRequestException('Falha ao processar pagamento cancelado');
    }
  }
}
