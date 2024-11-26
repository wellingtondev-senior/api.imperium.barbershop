import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerCustomService } from '../logger/logger.service';
import { CardDTO, StripePaymentDTO } from './dto/stripe-payment.dto';
import Stripe from 'stripe';
import { CreateScheduleDto } from '../../providers/schedule/dto/schedule.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly className: string;

  constructor(
    private readonly loggerService: LoggerCustomService,
    private readonly configService: ConfigService,
  ) {
    this.className = this.constructor.name;
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-11-20.acacia',
    });
  }

  /**
   * Processa um pagamento usando o Stripe
   * @param scheduleDto - DTO com os dados do agendamento
   * @returns Promise<Stripe.Charge>
   */
  async createPayment(scheduleDto: CreateScheduleDto): Promise<Stripe.Charge> {
    try {
      // Validar se há informações de pagamento
      if (!scheduleDto.payment || !scheduleDto.value) {
        throw new HttpException(
          'Informações de pagamento são obrigatórias',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Criar o token do cartão
      const token = await this.createCardToken(scheduleDto.payment);

      // Criar a cobrança
      const charge = await this.stripe.charges.create({
        amount: Math.round(scheduleDto.value * 100), // Convertendo para centavos
        currency: 'brl',
        source: token.id,
        description: `Pagamento do agendamento - Cliente: ${scheduleDto.clientInfo.name}`,
        metadata: {
          clientName: scheduleDto.clientInfo.name,
          clientEmail: scheduleDto.clientInfo.email,
          clientPhone: scheduleDto.clientInfo.phone,
          scheduleValue: scheduleDto.value.toString(),
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'createPayment',
        message: 'Pagamento processado com sucesso',
        context: {
          chargeId: charge.id,
          amount: charge.amount,
          status: charge.status,
        },
      });

      return charge;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createPayment',
        message: 'Erro ao processar pagamento',
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          clientName: scheduleDto.clientInfo.name,
          value: scheduleDto.value,
        },
      });

      if (error instanceof Stripe.errors.StripeCardError) {
        throw new HttpException(
          'Cartão inválido ou recusado',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erro ao processar pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cria um token para o cartão usando a API do Stripe
   * @param cardData - Dados do cartão
   * @returns Promise<Stripe.Token>
   */
  private async createCardToken(cardData: CardDTO): Promise<Stripe.Token> {
    try {
      const token = await this.stripe.tokens.create({
        card: {
          number: cardData.number,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
          cvc: cardData.cvc,
        },
      });

      return token;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createCardToken',
        message: 'Erro ao criar token do cartão',
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      if (error instanceof Stripe.errors.StripeCardError) {
        throw new HttpException(
          'Dados do cartão inválidos',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Erro ao processar dados do cartão',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reembolsa uma cobrança
   * @param chargeId - ID da cobrança no Stripe
   * @returns Promise<Stripe.Refund>
   */
  async refundPayment(chargeId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'refundPayment',
        message: 'Reembolso processado com sucesso',
        context: {
          refundId: refund.id,
          chargeId: chargeId,
          status: refund.status,
        },
      });

      return refund;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'refundPayment',
        message: 'Erro ao processar reembolso',
        context: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          chargeId,
        },
      });

      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new HttpException(
          'Cobrança não encontrada ou já reembolsada',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Erro ao processar reembolso',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
