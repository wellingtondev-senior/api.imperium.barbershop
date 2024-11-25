import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { MailerService } from '../mailer/mailer.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreatePaymentDTO, StripeWebhookDTO } from './dto/payment.dto';
import Stripe from 'stripe';

jest.mock('stripe');

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let mailerService: MailerService;
  let stripeMock: jest.Mocked<Stripe>;

  const mockAppointment = {
    id: 1,
    status: 'pending',
    service: {
      id: 1,
      name: 'Haircut',
      price: 50.00,
    },
    professional: {
      id: 1,
      name: 'John Doe',
      user: {
        id: 1,
        email: 'john@example.com',
      },
    },
    serviceId: 1,
  };

  const mockPayment = {
    id: 1,
    amount: 50.00,
    status: 'succeeded',
    method: 'credit_card',
    stripePaymentId: 'ch_123456',
    serviceId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: LoggerCustomService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendEmailConfirmPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
    mailerService = module.get<MailerService>(MailerService);
    stripeMock = (Stripe as jest.MockedClass<typeof Stripe>).prototype;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPayment', () => {
    const mockCreatePaymentDTO: CreatePaymentDTO = {
      appointmentId: 1,
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2024,
        cvc: '123',
      },
    };

    const mockStripeToken = {
      id: 'tok_123456',
    };

    const mockStripeCharge = {
      id: 'ch_123456',
      status: 'succeeded',
      amount: 5000,
    };

    beforeEach(() => {
      jest.spyOn(prismaService.appointment, 'findUnique').mockResolvedValue(mockAppointment);
      jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment);
      jest.spyOn(prismaService.appointment, 'update').mockResolvedValue({ ...mockAppointment, status: 'confirmed' });
      stripeMock.tokens.create = jest.fn().mockResolvedValue(mockStripeToken);
      stripeMock.charges.create = jest.fn().mockResolvedValue(mockStripeCharge);
    });

    it('should process payment successfully', async () => {
      const result = await service.processPayment(mockCreatePaymentDTO);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: {
          paymentId: mockPayment.id,
          status: mockPayment.status,
          appointmentId: mockAppointment.id,
        },
      });

      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreatePaymentDTO.appointmentId },
        include: {
          service: true,
          professional: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(stripeMock.tokens.create).toHaveBeenCalledWith({
        card: mockCreatePaymentDTO.card,
      });

      expect(stripeMock.charges.create).toHaveBeenCalledWith({
        amount: mockAppointment.service.price * 100,
        currency: 'brl',
        source: mockStripeToken.id,
        metadata: {
          appointmentId: mockAppointment.id.toString(),
        },
        description: `Pagamento para ${mockAppointment.service.name} - Profissional: ${mockAppointment.professional.name}`,
      });
    });

    it('should throw error when appointment not found', async () => {
      jest.spyOn(prismaService.appointment, 'findUnique').mockResolvedValue(null);

      await expect(service.processPayment(mockCreatePaymentDTO)).rejects.toThrow(
        new HttpException('Agendamento não encontrado', HttpStatus.NOT_FOUND),
      );
    });

    it('should handle Stripe token creation error', async () => {
      stripeMock.tokens.create = jest.fn().mockRejectedValue(new Error('Invalid card'));

      await expect(service.processPayment(mockCreatePaymentDTO)).rejects.toThrow(
        new HttpException('Invalid card', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('handleWebhook', () => {
    const mockWebhookData: StripeWebhookDTO = {
      type: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_123456',
          amount: 5000,
          metadata: {
            appointmentId: '1',
          },
        },
      },
    };

    beforeEach(() => {
      jest.spyOn(prismaService.appointment, 'findUnique').mockResolvedValue(mockAppointment);
      jest.spyOn(prismaService.payment, 'updateMany').mockResolvedValue({ count: 1 });
      jest.spyOn(prismaService.appointment, 'update').mockResolvedValue({ ...mockAppointment, status: 'confirmed' });
    });

    it('should handle successful payment webhook', async () => {
      await service.handleWebhook(mockWebhookData);

      expect(prismaService.payment.updateMany).toHaveBeenCalledWith({
        where: {
          appointment: {
            id: parseInt(mockWebhookData.data.object.metadata.appointmentId),
          },
        },
        data: {
          status: 'completed',
          stripePaymentId: mockWebhookData.data.object.id,
        },
      });

      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: parseInt(mockWebhookData.data.object.metadata.appointmentId) },
        data: {
          status: 'confirmed',
        },
      });

      expect(mailerService.sendEmailConfirmPayment).toHaveBeenCalled();
    });

    it('should handle failed payment webhook', async () => {
      const failedWebhookData: StripeWebhookDTO = {
        ...mockWebhookData,
        type: 'charge.failed',
      };

      await service.handleWebhook(failedWebhookData);

      expect(prismaService.payment.updateMany).toHaveBeenCalledWith({
        where: {
          appointment: {
            id: parseInt(failedWebhookData.data.object.metadata.appointmentId),
          },
        },
        data: {
          status: 'failed',
          stripePaymentId: failedWebhookData.data.object.id,
        },
      });

      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: parseInt(failedWebhookData.data.object.metadata.appointmentId) },
        data: {
          status: 'cancelled',
        },
      });
    });

    it('should handle appointment not found error', async () => {
      jest.spyOn(prismaService.appointment, 'findUnique').mockResolvedValue(null);

      await expect(service.handleWebhook(mockWebhookData)).rejects.toThrow(
        new HttpException('Agendamento não encontrado', HttpStatus.NOT_FOUND),
      );
    });
  });
});
