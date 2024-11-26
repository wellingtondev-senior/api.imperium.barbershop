import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleStatus } from './dto/schedule.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaService: PrismaService;

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
    },
    client: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCreateScheduleDto: CreateScheduleDto = {
      professionalId: 1,
      servicesId: [1],
      dateTime: '2024-01-20T10:00:00Z',
      value: 100,
      amount: 100,
      method: 'card',
      observation: 'Test schedule',
      clientInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      },
      payment: {
        number: '4242424242424242',
        exp_month: '12',
        exp_year: '2024',
        cvc: '123',
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
        value: 100,
        method: 'card',
        status: ScheduleStatus.PENDING,
      };

      const mockSchedule = {
        id: 1,
        date: new Date('2024-01-20T10:00:00Z'),
        status: ScheduleStatus.PENDING,
        notes: 'Test schedule',
        professionalId: 1,
        clientId: 1,
        serviceId: 1,
        paymentId: 1,
        professional: {
          id: 1,
          name: 'Professional',
          workingHours: null,
          services: []
        },
        client: mockClient,
        service: { id: 1, name: 'Service' },
        payment: mockPayment,
      };

      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.client.findFirst.mockResolvedValue(null);
      mockPrismaService.client.create.mockResolvedValue(mockClient);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(mockCreateScheduleDto);

      expect(result).toEqual({
        statusCode: 201,
        message: 'Schedule created successfully',
        data: mockSchedule,
      });
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

      await service.create(mockCreateScheduleDto);

      expect(mockPrismaService.client.create).not.toHaveBeenCalled();
    });

    it('should throw error if professional not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue(null);

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if any service not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([]);

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if time slot is already booked', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.service.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.schedule.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.create(mockCreateScheduleDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

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
          service: { id: 1, name: 'Service' },
          payment: { id: 1, status: ScheduleStatus.PENDING },
        },
      ];

      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findAll();

      expect(result).toEqual({
        statusCode: 200,
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
        service: { id: 1, name: 'Service' },
        payment: { id: 1, status: ScheduleStatus.PENDING },
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne(1);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Schedule retrieved successfully',
        data: mockSchedule,
      });
    });

    it('should throw error if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
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
          service: { id: 1, name: 'Service' },
          payment: { id: 1, status: ScheduleStatus.PENDING },
        },
      ];

      mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findByProfessional(1);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Professional schedules retrieved successfully',
        data: mockSchedules,
      });
    });

    it('should throw error if professional not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue(null);

      await expect(service.findByProfessional(1)).rejects.toThrow(
        NotFoundException,
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
          service: { id: 1, name: 'Service' },
          payment: { id: 1, status: ScheduleStatus.PENDING },
        },
      ];

      mockPrismaService.client.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findByClient(1);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Client schedules retrieved successfully',
        data: mockSchedules,
      });
    });

    it('should throw error if client not found', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findByClient(1)).rejects.toThrow(NotFoundException);
    });
  });

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
        service: { id: 1, name: 'Service' },
        payment: { id: 1, status: ScheduleStatus.CONFIRMED },
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.schedule.update.mockResolvedValue(mockUpdatedSchedule);

      const result = await service.update(1, mockUpdateScheduleDto);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      });
    });

    it('should throw error if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(
        service.update(1, mockUpdateScheduleDto),
      ).rejects.toThrow(NotFoundException);
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
        service: { id: 1, name: 'Service' },
        payment: { id: 1, status: ScheduleStatus.CANCELED },
      };

      mockPrismaService.schedule.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.schedule.update.mockResolvedValue(mockCanceledSchedule);

      const result = await service.cancel(1);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Schedule canceled successfully',
        data: mockCanceledSchedule,
      });
    });

    it('should throw error if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.cancel(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a schedule successfully', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.schedule.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Schedule deleted successfully',
      });
    });

    it('should throw error if schedule not found', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
