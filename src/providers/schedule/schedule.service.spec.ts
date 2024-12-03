import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleStatus } from './dto/schedule.dto';
import { PaymentMethod } from './dto/payment.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StripeService } from '../../modulos/stripe/stripe.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaService: PrismaService;
  let stripeService: StripeService;

  const mockPrismaService = {
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    professional: {
      findUnique: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
    },
    client: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockStripeService = {
    processPayment: jest.fn(),
    refundPayment: jest.fn(),
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
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Schedule Query Operations
  describe('Schedule Queries', () => {
    describe('findAll', () => {
      it('should return all schedules', async () => {
        const mockSchedules = [
          {
            id: 1,
            date: new Date(),
            status: ScheduleStatus.PENDING,
            notes: 'Test schedule',
            professional: {
              id: 1,
              name: 'Professional',
              workingHours: null,
              services: []
            },
            client: { id: 1, name: 'Client' },
            services: [{ id: 1, name: 'Service' }],
            payment: { id: 1, status: ScheduleStatus.PENDING },
          },
        ];

        mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

        const result = await service.findAll();

        expect(result).toEqual({
          success: true,
          message: 'Schedules retrieved successfully',
          data: mockSchedules,
        });
      });
    });

    describe('findOne', () => {
      it('should return a schedule by id', async () => {
        const mockSchedule = {
          id: 1,
          date: new Date(),
          status: ScheduleStatus.PENDING,
          notes: 'Test schedule',
          professional: {
            id: 1,
            name: 'Professional',
            workingHours: null,
            services: []
          },
          client: { id: 1, name: 'Client' },
          services: [{ id: 1, name: 'Service' }],
          payment: { id: 1, status: ScheduleStatus.PENDING },
        };

        mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

        const result = await service.findOne(1);

        expect(result).toEqual({
          success: true,
          message: 'Schedule retrieved successfully',
          data: mockSchedule,
        });
      });

      it('should throw error if schedule not found', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue(null);

        await expect(service.findOne(1)).rejects.toThrow('Schedule not found');
      });
    });

    describe('findByDateRange', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      it('should return schedules within date range', async () => {
        const mockSchedules = [
          {
            id: 1,
            date: new Date('2024-01-15'),
            status: ScheduleStatus.PENDING,
            notes: 'Test schedule',
            professional: {
              id: 1,
              name: 'Professional',
              workingHours: null,
              services: []
            },
            client: { id: 1, name: 'Client' },
            services: [{ id: 1, name: 'Service' }],
            payment: { id: 1, status: ScheduleStatus.PENDING },
          }
        ];

        mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

        const result = await service.findByDateRange(startDate, endDate);

        expect(result).toEqual({
          success: true,
          message: 'Schedules retrieved successfully',
          data: mockSchedules,
        });

        expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            }
          },
          include: {
            professional: true,
            client: true,
            services: true,
            payment: true,
          },
        });
      });

      it('should return empty array when no schedules found', async () => {
        mockPrismaService.schedule.findMany.mockResolvedValue([]);

        const result = await service.findByDateRange(startDate, endDate);

        expect(result).toEqual({
          success: true,
          message: 'Schedules retrieved successfully',
          data: [],
        });
      });

      it('should handle invalid date range', async () => {
        const invalidEndDate = new Date('2024-01-01');
        const invalidStartDate = new Date('2024-01-31');

        await expect(service.findByDateRange(invalidStartDate, invalidEndDate))
          .rejects.toThrow('Invalid date range');
      });
    });

    describe('findByStatus', () => {
      it('should return schedules by status', async () => {
        const mockSchedules = [
          {
            id: 1,
            date: new Date(),
            status: ScheduleStatus.PENDING,
            notes: 'Test schedule',
            professional: {
              id: 1,
              name: 'Professional',
              workingHours: null,
              services: []
            },
            client: { id: 1, name: 'Client' },
            services: [{ id: 1, name: 'Service' }],
            payment: { id: 1, status: ScheduleStatus.PENDING },
          }
        ];

        mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

        const result = await service.findByStatus(ScheduleStatus.PENDING);

        expect(result).toEqual({
          success: true,
          message: 'Schedules retrieved successfully',
          data: mockSchedules,
        });

        expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
          where: { status: ScheduleStatus.PENDING },
          include: {
            professional: true,
            client: true,
            services: true,
            payment: true,
          },
        });
      });

      it('should return empty array when no schedules found with status', async () => {
        mockPrismaService.schedule.findMany.mockResolvedValue([]);

        const result = await service.findByStatus(ScheduleStatus.CANCELED);

        expect(result).toEqual({
          success: true,
          message: 'Schedules retrieved successfully',
          data: [],
        });
      });
    });

    describe('findByProfessional', () => {
      it('should return schedules for a professional', async () => {
        const mockSchedules = [
          {
            id: 1,
            date: new Date(),
            status: ScheduleStatus.PENDING,
            professional: {
              id: 1,
              name: 'Professional',
              workingHours: null,
              services: []
            },
            client: { id: 1, name: 'Client' },
            services: [{ id: 1, name: 'Service' }],
            payment: { id: 1, status: ScheduleStatus.PENDING },
          },
        ];

        mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

        const result = await service.findByProfessional(1);

        expect(result).toEqual({
          success: true,
          message: 'Professional schedules retrieved successfully',
          data: mockSchedules,
        });
      });

      it('should throw error if professional not found', async () => {
        mockPrismaService.professional.findUnique.mockResolvedValue(null);

        await expect(service.findByProfessional(1)).rejects.toThrow(
          'Professional not found',
        );
      });
    });

    describe('findByClient', () => {
      it('should return schedules for a client', async () => {
        const mockSchedules = [
          {
            id: 1,
            date: new Date(),
            status: ScheduleStatus.PENDING,
            professional: {
              id: 1,
              name: 'Professional',
              workingHours: null,
              services: []
            },
            client: { id: 1, name: 'Client' },
            services: [{ id: 1, name: 'Service' }],
            payment: { id: 1, status: ScheduleStatus.PENDING },
          },
        ];

        mockPrismaService.client.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

        const result = await service.findByClient(1);

        expect(result).toEqual({
          success: true,
          message: 'Client schedules retrieved successfully',
          data: mockSchedules,
        });
      });

      it('should throw error if client not found', async () => {
        mockPrismaService.client.findUnique.mockResolvedValue(null);

        await expect(service.findByClient(1)).rejects.toThrow('Client not found');
      });
    });
  });

  // Schedule Creation and Validation
  describe('Schedule Creation', () => {
    const mockCreateScheduleDto: CreateScheduleDto = {
      professionalId: 1,
      servicesId: [1],
      dateTime: '2024-01-20T10:00:00Z',
      notes: 'Test schedule',
      clientInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        phoneCountry: 'BR'
      },
      payment: {
        amount: 100,
        method: PaymentMethod.CARD,
        cardName: 'John Doe',
        cardNumber: '4242424242424242',
        cardExpiry: '12/25',
        cardCvv: '123',
      },
    };

    it('should create a schedule successfully', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const mockPayment = {
        id: 1,
        amount: 100,
        method: 'card',
        status: ScheduleStatus.PENDING,
        stripePaymentId: 'pi_123456',
      };

      const mockSchedule = {
        id: 1,
        date: new Date('2024-01-20T10:00:00Z'),
        status: ScheduleStatus.PENDING,
        notes: 'Test schedule',
        professionalId: 1,
        clientId: 1,
        services: [{ id: 1, name: 'Service' }],
        paymentId: 1,
        professional: { id: 1, name: 'Professional', workingHours: null },
        client: mockClient,
        payment: mockPayment,
      };

      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockStripeService.processPayment.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        data: {
          stripePaymentId: 'pi_123456',
          amount: 100,
          status: 'succeeded'
        }
      });
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(mockCreateScheduleDto);

      expect(result).toEqual({
        success: true,
        message: 'Schedule created successfully',
        data: mockSchedule,
      });
      expect(mockStripeService.processPayment).toHaveBeenCalledWith(mockCreateScheduleDto);
    });

    it('should use existing client if found', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockStripeService.processPayment.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        data: {
          stripePaymentId: 'pi_123456',
          amount: 100,
          status: 'succeeded'
        }
      });

      await service.create(mockCreateScheduleDto);

      expect(mockPrismaService.client.create).not.toHaveBeenCalled();
    });

    it('should throw error if professional not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue(null);

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        'Professional not found',
      );
    });

    it('should throw error if any service not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([]);

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        'One or more services not found',
      );
    });

    it('should throw error if time slot is already booked', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        'Professional is not available at this time',
      );
    });

    it('should handle payment processing failure', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.client.findFirst.mockResolvedValue({ id: 1 });
      mockStripeService.processPayment.mockResolvedValue({ success: false });

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow('Payment failed');
      expect(mockStripeService.processPayment).toHaveBeenCalledWith(mockCreateScheduleDto);
    });

    it('should handle invalid service IDs', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([]);

      await expect(service.create({ ...mockCreateScheduleDto, servicesId: [999] }))
        .rejects.toThrow('One or more services not found');
    });

    it('should handle invalid professional schedule', async () => {
      const mockProfessional = {
        id: 1,
        workingHours: {
          saturday: { start: '09:00', end: '17:00' }
        }
      };

      mockPrismaService.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);

      // January 20, 2024 is a Saturday
      const invalidTimeDto = {
        ...mockCreateScheduleDto,
        dateTime: '2024-01-20T20:00:00Z' // 8 PM, outside working hours
      };

      await expect(service.create(invalidTimeDto))
        .rejects.toThrow('Professional is not available at this time');
    });

    it('should handle database transaction failure', async () => {
      const mockClient = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.client.findFirst.mockResolvedValue(mockClient);
      mockStripeService.processPayment.mockResolvedValue({
        success: true,
        message: 'Payment processed successfully',
        data: {
          stripePaymentId: 'pi_123456',
          amount: 100,
          status: 'succeeded'
        }
      });
      mockPrismaService.schedule.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateScheduleDto))
        .rejects.toThrow('Error creating schedule');
    });
  });

  // Schedule Management Operations
  describe('Schedule Management', () => {
    describe('update', () => {
      const mockUpdateScheduleDto: UpdateScheduleDto = {
        status: ScheduleStatus.CONFIRMED,
      };

      it('should update a schedule successfully', async () => {
        const mockUpdatedSchedule = {
          id: 1,
          date: new Date(),
          status: ScheduleStatus.CONFIRMED,
          notes: 'Test schedule',
          professional: {
            id: 1,
            name: 'Professional',
            workingHours: null,
            services: []
          },
          client: { id: 1, name: 'Client' },
          services: [{ id: 1, name: 'Service' }],
          payment: { id: 1, status: ScheduleStatus.CONFIRMED },
        };

        mockPrismaService.schedule.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.schedule.update.mockResolvedValue(mockUpdatedSchedule);

        const result = await service.update(1, mockUpdateScheduleDto);

        expect(result).toEqual({
          success: true,
          message: 'Schedule updated successfully',
          data: mockUpdatedSchedule,
        });
      });

      it('should throw error if schedule not found', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue(null);

        await expect(service.update(1, mockUpdateScheduleDto)).rejects.toThrow(
          'Schedule not found',
        );
      });
    });

    describe('cancel', () => {
      it('should cancel a schedule successfully', async () => {
        const mockCanceledSchedule = {
          id: 1,
          date: new Date(),
          status: ScheduleStatus.CANCELED,
          notes: 'Test schedule',
          professional: {
            id: 1,
            name: 'Professional',
            workingHours: null,
            services: []
          },
          client: { id: 1, name: 'Client' },
          services: [{ id: 1, name: 'Service' }],
          payment: { 
            id: 1, 
            status: ScheduleStatus.CANCELED,
            stripePaymentId: 'pi_123456'
          },
        };

        mockPrismaService.schedule.findUnique.mockResolvedValue({
          ...mockCanceledSchedule,
          status: ScheduleStatus.PENDING,
          payment: {
            id: 1,
            status: ScheduleStatus.PENDING,
            stripePaymentId: 'pi_123456'
          }
        });
        mockStripeService.refundPayment.mockResolvedValue({ id: 're_123456' });
        mockPrismaService.payment.update.mockResolvedValue(mockCanceledSchedule.payment);
        mockPrismaService.schedule.update.mockResolvedValue(mockCanceledSchedule);

        const result = await service.cancel(1);

        expect(result).toEqual({
          success: true,
          message: 'Schedule canceled successfully',
          data: mockCanceledSchedule,
        });
      });

      it('should throw error if schedule not found', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue(null);

        await expect(service.cancel(1)).rejects.toThrow('Schedule not found');
      });
    });

    describe('remove', () => {
      it('should delete a schedule successfully', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.schedule.delete.mockResolvedValue({ id: 1 });

        const result = await service.remove(1);

        expect(result).toEqual({
          success: true,
          message: 'Schedule deleted successfully',
        });
      });

      it('should throw error if schedule not found', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue(null);

        await expect(service.remove(1)).rejects.toThrow('Schedule not found');
      });
    });
  });

  // Payment Operations
  describe('Payment Operations', () => {
    describe('updatePaymentStatus', () => {
      it('should update payment status successfully', async () => {
        const mockSchedule = {
          id: 1,
          payment: {
            id: 1,
            status: ScheduleStatus.PENDING,
            stripePaymentId: 'pi_123456'
          }
        };

        const updatedPayment = {
          ...mockSchedule.payment,
          status: ScheduleStatus.CONFIRMED
        };

        mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
        mockPrismaService.payment.update.mockResolvedValue(updatedPayment);

        const result = await service.updatePaymentStatus(1, ScheduleStatus.CONFIRMED);

        expect(result).toEqual({
          success: true,
          message: 'Payment status updated successfully',
          data: updatedPayment,
        });
      });

      it('should handle schedule not found', async () => {
        mockPrismaService.schedule.findUnique.mockResolvedValue(null);

        await expect(service.updatePaymentStatus(1, ScheduleStatus.CONFIRMED))
          .rejects.toThrow('Schedule not found');
      });

      it('should handle payment update failure', async () => {
        const mockSchedule = {
          id: 1,
          payment: {
            id: 1,
            status: ScheduleStatus.PENDING,
            stripePaymentId: 'pi_123456'
          }
        };

        mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);
        mockPrismaService.payment.update.mockRejectedValue(new Error('Update failed'));

        await expect(service.updatePaymentStatus(1, ScheduleStatus.CONFIRMED))
          .rejects.toThrow('Error updating payment status');
      });
    });
  });
});
