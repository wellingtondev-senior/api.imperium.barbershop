import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { LoggerCustomService } from '../logger/logger.service';
import { CreateScheduleDto } from '../../providers/schedule/dto/schedule.dto';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentMethod } from '../../providers/schedule/dto/payment.dto';

describe('StripeService', () => {
  let service: StripeService;

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test_stripe_key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: LoggerCustomService,
          useValue: mockLoggerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    const mockScheduleDto: CreateScheduleDto = {
      professionalId: 1,
      servicesId: [1],
      dateTime: new Date().toISOString(),
      notes: 'Test schedule',
      clientInfo: {
        name: 'Test Client',
        email: 'test@email.com',
        phone: '1234567890',
        phoneCountry: 'BR'
      },
      payment: {
        amount: 100,
        method: PaymentMethod.CARD,
        cardNumber: '4242424242424242',
        cardExpiry: '12/24',
        cardCvv: '123',
        cardName: 'Test Client'
      }
    };

    it('should process payment successfully', async () => {
      // Mock Stripe methods
      const mockStripe = {
        customers: {
          create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
        },
        tokens: {
          create: jest.fn().mockResolvedValue({ id: 'tok_test' }),
        },
        paymentIntents: {
          create: jest.fn().mockResolvedValue({
            id: 'pi_test',
            client_secret: 'pi_test_secret',
            status: 'succeeded',
            amount: 10000,
          }),
        },
      };
      (service as any).stripe = mockStripe;

      const result = await service.processPayment(mockScheduleDto);

      expect(result).toEqual({
        success: true,
        message: 'Payment processed successfully',
        data: {
          stripePaymentId: 'pi_test',
          amount: mockScheduleDto.payment.amount,
          status: 'succeeded',
          clientSecret: 'pi_test_secret'
        }
      });

      expect(mockStripe.tokens.create).toHaveBeenCalledWith({
        card: {
          number: mockScheduleDto.payment.cardNumber,
          exp_month: '12',
          exp_year: '2024',
          cvc: mockScheduleDto.payment.cardCvv,
        },
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: mockScheduleDto.clientInfo.email,
        source: 'tok_test'
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        customer: 'cus_test',
        payment_method_types: ['card'],
        metadata: {
          scheduleId: 'pending',
          clientEmail: mockScheduleDto.clientInfo.email,
          scheduleAmount: mockScheduleDto.payment.amount.toString(),
        },
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });
    });

    it('should throw error when payment info is missing', async () => {
      const invalidScheduleDto = { ...mockScheduleDto, payment: undefined };

      await expect(service.processPayment(invalidScheduleDto))
        .rejects
        .toThrow('Payment information is required');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'processPayment',
        message: 'Error processing payment',
        context: {
          error: 'Payment information is required',
          clientEmail: mockScheduleDto.clientInfo.email
        },
      });
    });

    it('should handle card error from Stripe', async () => {
      const mockStripe = {
        customers: {
          create: jest.fn().mockRejectedValue(
            new Stripe.errors.StripeCardError({
              type: 'card_error',
              code: 'card_declined',
              message: 'Invalid card',
              param: 'card',
              charge: 'ch_test'
            })
          ),
        },
        tokens: {
          create: jest.fn().mockResolvedValue({ id: 'tok_test' }),
        },
      };
      (service as any).stripe = mockStripe;

      await expect(service.processPayment(mockScheduleDto))
        .rejects
        .toThrow('Invalid card information');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'processPayment',
        message: 'Error processing payment',
        context: {
          error: 'Invalid card',
          clientEmail: mockScheduleDto.clientInfo.email
        },
      });
    });
  });

  describe('refundPayment', () => {
    const paymentIntentId = 'pi_test';

    it('should process refund successfully', async () => {
      const mockStripe = {
        paymentIntents: {
          retrieve: jest.fn().mockResolvedValue({ id: paymentIntentId }),
        },
        refunds: {
          create: jest.fn().mockResolvedValue({
            id: 're_test',
            status: 'succeeded',
          }),
        },
      };
      (service as any).stripe = mockStripe;

      const result = await service.refundPayment(paymentIntentId);

      expect(result).toBeDefined();
      expect(result.id).toBe('re_test');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'refundPayment',
        message: 'Refund processed successfully',
        context: {
          refundId: 're_test',
          paymentIntentId: paymentIntentId,
          status: 'succeeded',
        },
      });
    });

    it('should handle refund error from Stripe', async () => {
      const mockStripe = {
        paymentIntents: {
          retrieve: jest.fn().mockResolvedValue({ id: paymentIntentId }),
        },
        refunds: {
          create: jest.fn().mockRejectedValue(new Error('Payment not found')),
        },
      };
      (service as any).stripe = mockStripe;

      await expect(service.refundPayment(paymentIntentId))
        .rejects
        .toThrow('Error processing refund');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'refundPayment',
        message: 'Error processing refund',
        context: {
          error: 'Payment not found',
          paymentIntentId,
        },
      });
    });
  });
});
