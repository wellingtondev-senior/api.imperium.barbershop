import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerCustomService } from '../logger/logger.service';
import { CardDTO } from './dto/stripe-payment.dto';
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
      appInfo: {
        name: 'imperium-barbershop',
        version: '1.0.0',
      },
      typescript: true,
    });
  }

  /**
   * Process a payment using Stripe PaymentIntent
   * @param scheduleDto - Schedule creation DTO with payment information
   * @returns Promise with payment result
   */
  async processPayment(scheduleDto: CreateScheduleDto) {
    try {
      if (!scheduleDto.payment) {
        throw new Error('Payment information is required');
      }

      // Create a Customer
      const customer = await this.stripe.customers.create({
        email: scheduleDto.clientInfo.email,
        source: await this.createCardToken({
          number: scheduleDto.payment.cardNumber,
          exp_month: scheduleDto.payment.cardExpiry.split('/')[0],
          exp_year: '20' + scheduleDto.payment.cardExpiry.split('/')[1],
          cvc: scheduleDto.payment.cardCvv
        }).then(token => token.id)
      });

      // Create a PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(scheduleDto.payment.amount * 100), // Converting to cents
        currency: 'usd',
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          scheduleId: 'pending',
          clientEmail: scheduleDto.clientInfo.email,
          scheduleAmount: scheduleDto.payment.amount.toString(),
        },
        confirm: true, // Confirm the payment immediately
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          message: 'Payment processed successfully',
          data: {
            stripePaymentId: paymentIntent.id,
            amount: scheduleDto.payment.amount,
            status: paymentIntent.status,
            clientSecret: paymentIntent.client_secret
          }
        };
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'processPayment',
        message: `Error processing payment: ${error.message}`,
        context: {
          clientEmail: scheduleDto.clientInfo.email,
          paymentAmount: scheduleDto.payment.amount,
          errorType: error instanceof Stripe.errors.StripeCardError ? 'Card Error' : 'General Error',
        },
      });

      if (error instanceof Stripe.errors.StripeCardError) {
        throw new HttpException(
          'Invalid card information',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new Error(`Error processing payment: ${error.message}`);
    }
  }

  /**
   * Create a card token using the Stripe API
   * @param cardData - Card information
   * @returns Promise<Stripe.Token>
   */
  async createCardToken(cardData: CardDTO): Promise<Stripe.Token> {
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
        message: `Error creating card token: ${error.message}`,
        context: {
          cardLast4: cardData.number.slice(-4),
          errorType: error instanceof Stripe.errors.StripeCardError ? 'Card Error' : 'General Error',
        },
      });

      if (error instanceof Stripe.errors.StripeCardError) {
        throw new HttpException(
          'Invalid card information',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Error processing card information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refund a payment
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @returns Promise<Stripe.Refund>
   */
  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'refundPayment',
        message: 'Refund processed successfully',
        context: {
          refundId: refund.id,
          paymentIntentId: paymentIntentId,
          status: refund.status,
        },
      });

      return refund;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'refundPayment',
        message: 'Error processing refund',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          paymentIntentId,
        },
      });

      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new HttpException(
          'Payment not found or already refunded',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Error processing refund',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCustomer(email: string, cardToken: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        source: cardToken
      });
      return customer;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createCustomer',
        message: `Error creating customer: ${error.message}`,
        context: {
          email,
          errorType: error instanceof Stripe.errors.StripeCardError ? 'Card Error' : 'General Error',
        },
      });
      throw new HttpException('Error creating customer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createPaymentIntent(amount: number, currency: string, customerId: string, metadata: any): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method_types: ['card'],
        metadata,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });
      return paymentIntent;
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createPaymentIntent',
        message: `Error creating payment intent: ${error.message}`,
        context: {
          customerId,
          errorType: error instanceof Stripe.errors.StripeCardError ? 'Card Error' : 'General Error',
        },
      });
      throw new HttpException('Error creating payment intent', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
