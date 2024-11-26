import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { LoggerCustomService } from '../logger/logger.service';
import { CreateScheduleDto } from '../../providers/schedule/dto/schedule.dto';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

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

  describe('createPayment', () => {
    const mockScheduleDto: Partial<CreateScheduleDto> = {
      value: 100,
      amount: 100,
      method: 'card',
      observation: 'Test schedule',
      professionalId: 1,
      servicesId: [1],
      dateTime: new Date().toISOString(),
      clientInfo: {
        name: 'Test Client',
        email: 'test@email.com',
        phone: '1234567890',
      },
      payment: {
        number: '4242424242424242',
        exp_month: '12',
        exp_year: '2024',
        cvc: '123',
      },
    };

    it('should process payment successfully', async () => {
      // Mock Stripe methods
      const mockStripe = {
        tokens: {
          create: jest.fn().mockResolvedValue({ id: 'tok_test' }),
        },
        charges: {
          create: jest.fn().mockResolvedValue({
            id: 'ch_test',
            amount: 10000,
            status: 'succeeded',
          }),
        },
      };
      (service as any).stripe = mockStripe;

      const result = await service.createPayment(mockScheduleDto as CreateScheduleDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('ch_test');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.tokens.create).toHaveBeenCalledWith({
        card: {
          number: mockScheduleDto.payment.number,
          exp_month: mockScheduleDto.payment.exp_month,
          exp_year: mockScheduleDto.payment.exp_year,
          cvc: mockScheduleDto.payment.cvc,
        },
      });
      expect(mockStripe.charges.create).toHaveBeenCalledWith({
        amount: 10000, // 100 * 100 (convertendo para centavos)
        currency: 'brl',
        source: 'tok_test',
        description: `Pagamento do agendamento - Cliente: ${mockScheduleDto.clientInfo.name}`,
        metadata: {
          clientName: mockScheduleDto.clientInfo.name,
          clientEmail: mockScheduleDto.clientInfo.email,
          clientPhone: mockScheduleDto.clientInfo.phone,
          scheduleValue: mockScheduleDto.value.toString(),
        },
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'createPayment',
        message: 'Pagamento processado com sucesso',
        context: {
          chargeId: 'ch_test',
          amount: 10000,
          status: 'succeeded',
        },
      });
    });

    it('should throw error when payment info is missing', async () => {
      const invalidScheduleDto = { ...mockScheduleDto };
      delete invalidScheduleDto.payment;

      await expect(service.createPayment(invalidScheduleDto as CreateScheduleDto))
        .rejects
        .toThrow('Informações de pagamento são obrigatórias');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'createPayment',
        message: 'Erro ao processar pagamento',
        context: {
          error: 'Informações de pagamento são obrigatórias',
          clientName: mockScheduleDto.clientInfo.name,
          value: mockScheduleDto.value,
        },
      });
    });

    it('should handle card error from Stripe', async () => {
      const mockStripe = {
        tokens: {
          create: jest.fn().mockRejectedValue(new Error('Invalid card')),
        },
      };
      (service as any).stripe = mockStripe;

      await expect(service.createPayment(mockScheduleDto as CreateScheduleDto))
        .rejects
        .toThrow('Erro ao processar dados do cartão');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'createCardToken',
        message: 'Erro ao criar token do cartão',
        context: {
          error: 'Invalid card',
        },
      });
    });
  });

  describe('refundPayment', () => {
    const chargeId = 'ch_test';

    it('should process refund successfully', async () => {
      const mockStripe = {
        refunds: {
          create: jest.fn().mockResolvedValue({
            id: 're_test',
            status: 'succeeded',
          }),
        },
      };
      (service as any).stripe = mockStripe;

      const result = await service.refundPayment(chargeId);

      expect(result).toBeDefined();
      expect(result.id).toBe('re_test');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        charge: chargeId,
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'refundPayment',
        message: 'Reembolso processado com sucesso',
        context: {
          refundId: 're_test',
          chargeId: chargeId,
          status: 'succeeded',
        },
      });
    });

    it('should handle refund error from Stripe', async () => {
      const mockStripe = {
        refunds: {
          create: jest.fn().mockRejectedValue(new Error('Charge not found')),
        },
      };
      (service as any).stripe = mockStripe;

      await expect(service.refundPayment(chargeId))
        .rejects
        .toThrow('Erro ao processar reembolso');

      expect(mockLoggerService.error).toHaveBeenCalledWith({
        className: 'StripeService',
        functionName: 'refundPayment',
        message: 'Erro ao processar reembolso',
        context: {
          error: 'Charge not found',
          chargeId,
        },
      });
    });
  });
});
