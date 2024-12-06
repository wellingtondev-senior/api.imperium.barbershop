import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto, PaymentData } from './dto/schedule.dto';
import { MailerService } from '../mailer/mailer.service';
import { SmsService } from '../sms/sms.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServiceDto } from '../service/dto/service.dto';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaService: PrismaService;
  let mailerService: MailerService;
  let smsService: SmsService;

  const mockPrismaService = {
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    professional: {
      findUnique: jest.fn(),
    },
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailerService = module.get<MailerService>(MailerService);
    smsService = module.get<SmsService>(SmsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockService: ServiceDto = {
    id: 1,
    name: 'Haircut',
    description: 'Basic haircut',
    price: 30,
    duration: 30,
    active: true,
    professionalId: 1,
  };

  const mockCreateScheduleDto: CreateScheduleDto = {
    services: [mockService],
    date: new Date('2024-01-20T10:00:00Z'),
    time: '10:00',
    professionalId: 1,
    payment: {
      id: 'pi_123',
      object: 'payment_intent',
      amount: 3000,
      client_secret: 'secret_123',
      created: 1642665600,
      currency: 'usd',
      status: 'succeeded',
      payment_method: 'pm_123',
      livemode: false,
      type: 'payment_intent.created',
      api_version: '2024-11-20.acacia',
      pending_webhooks: 0,
      request: {
        id: 'pi_123',
        idempotency_key: null
      },
      data: null
    },
    clientInfo: {
      cardName: 'John Doe',
      email: 'john@example.com',
      phoneCountry: '+55',
    },
  };

  const mockPayment: PaymentData = {
    id: 'pi_123',
    object: 'payment_intent',
    amount: 3000,
    client_secret: 'secret_123',
    created: 1642665600,
    currency: 'usd',
    status: 'succeeded',
    payment_method: 'pm_123',
    livemode: false,
    type: 'payment_intent.created',
    api_version: '2024-11-20.acacia',
    pending_webhooks: 0,
    request: {
      id: 'pi_123',
      idempotency_key: null
    },
    data: null
  };

  describe('create', () => {
    it('should create a schedule successfully', async () => {
      mockPrismaService.client.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);
      mockPrismaService.schedule.create.mockResolvedValue({
        id: 1,
        date: new Date('2024-01-20T10:00:00Z'),
        status: 'pending',
        professional: { id: 1 },
        services: [mockService],
        Payment: mockPayment,
      });

      const result = await service.create(mockCreateScheduleDto);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('pending');
      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
      expect(mockPrismaService.schedule.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if professional not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue(null);

      await expect(service.create(mockCreateScheduleDto))
        .rejects
        .toThrow('Professional not found');
    });

    it('should throw BadRequestException if services not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([]);

      await expect(service.create(mockCreateScheduleDto))
        .rejects
        .toThrow('One or more services not found');
    });

    it('should handle payment creation failure', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.payment.create.mockRejectedValue(new Error('Payment failed'));

      await expect(service.create(mockCreateScheduleDto))
        .rejects
        .toThrow('Payment failed');
    });
  });

  describe('findAll', () => {
    it('should return all schedules', async () => {
      const mockSchedules = [
        {
          id: 1,
          date: new Date(),
          status: 'pending',
          professional: { id: 1 },
          services: [mockService],
          Payment: mockPayment,
        },
      ];

      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockSchedules);
      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      const mockSchedule = {
        id: 1,
        date: new Date(),
        status: 'pending',
        professional: { id: 1 },
        services: [mockService],
        Payment: mockPayment,
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockSchedule);
      expect(result.message).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel a schedule', async () => {
      const mockSchedule = {
        id: 1,
        status: 'pending',
        Payment: [mockPayment],
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.schedule.update.mockResolvedValue({
        ...mockSchedule,
        status: 'canceled',
        Payment: [{ ...mockPayment, status: 'canceled' }],
      });

      const result = await service.cancel(1);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: 'canceled',
          }),
        }),
      );
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.cancel(999))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const mockSchedule = {
        id: 1,
        Payment: [mockPayment],
      };

      const updatedPayment = {
        ...mockPayment,
        status: 'completed',
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.payment.update.mockResolvedValue(updatedPayment);

      const result = await service.updatePaymentStatus(1, 'completed');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedPayment);
      expect(result.message).toBeDefined();
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.updatePaymentStatus(999, 'completed'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should handle payment update failure', async () => {
      const mockSchedule = {
        id: 1,
        Payment: [mockPayment],
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
      mockPrismaService.payment.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.updatePaymentStatus(1, 'completed'))
        .rejects
        .toThrow('Error updating payment status');
    });
  });
});
