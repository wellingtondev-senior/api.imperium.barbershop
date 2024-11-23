import { Test, TestingModule } from '@nestjs/testing';
import { ServicesScheduleService } from './services-schedule.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { ServicesScheduleDto, CreateAppointmentDto, UpdateAppointmentDto, CreatePaymentDto, ServiceStatus } from './dto/services-schedule.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ServicesScheduleService', () => {
  let service: ServicesScheduleService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let sessionHashService: SessionHashService;
  let mailerService: MailerService;

  const mockServiceDto: ServicesScheduleDto = {
    name: 'Test Service',
    description: 'Test Description',
    price: 100,
    duration: 60,
    profissionalId: 1
  };

  const mockAppointmentDto: CreateAppointmentDto = {
    date: new Date(),
    professionalId: 1,
    serviceId: 1,
    fanId: 1
  };

  const mockPaymentDto: CreatePaymentDto = {
    amount: 100,
    method: 'credit_card',
    serviceId: 1
  };

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    professional: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    }
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockSessionHashService = {
    generateHash: jest.fn(),
  };

  const mockMailerService = {
    sendEmailConfirmRegister: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerCustomService,
          useValue: mockLoggerService,
        },
        {
          provide: SessionHashService,
          useValue: mockSessionHashService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<ServicesScheduleService>(ServicesScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
    sessionHashService = module.get<SessionHashService>(SessionHashService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Service Tests
  describe('Service CRUD', () => {
    describe('create', () => {
      it('should create a service successfully', async () => {
        const mockService = { id: 1, ...mockServiceDto };
        mockPrismaService.service.findUnique.mockResolvedValue(null);
        mockPrismaService.service.create.mockResolvedValue(mockService);

        const result = await service.create(mockServiceDto);

        expect(result.statusCode).toBe(HttpStatus.CREATED);
        expect(result.data).toEqual(mockService);
      });

      it('should return conflict if service name exists', async () => {
        mockPrismaService.service.findUnique.mockResolvedValue({ id: 1 });

        const result = await service.create(mockServiceDto);

        expect(result.statusCode).toBe(HttpStatus.CONFLICT);
      });
    });

    describe('findAll', () => {
      it('should return all services', async () => {
        const mockServices = [
          { id: 1, ...mockServiceDto },
          { id: 2, ...mockServiceDto, name: 'Test Service 2' }
        ];
        mockPrismaService.service.findMany.mockResolvedValue(mockServices);

        const result = await service.findAll();

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.data).toEqual(mockServices);
      });
    });

    describe('findOne', () => {
      it('should return a service by id', async () => {
        const mockService = { id: 1, ...mockServiceDto };
        mockPrismaService.service.findUnique.mockResolvedValue(mockService);

        const result = await service.findOne(1);

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.data).toEqual(mockService);
      });

      it('should throw error if service not found', async () => {
        mockPrismaService.service.findUnique.mockResolvedValue(null);

        await expect(service.findOne(999)).rejects.toThrow(HttpException);
      });
    });
  });

  // Appointment Tests
  describe('Appointment CRUD', () => {
    describe('createAppointment', () => {
      it('should create an appointment successfully', async () => {
        const mockService = { id: 1, ...mockServiceDto };
        const mockProfessional = { id: 1, name: 'Test Professional' };
        const mockAppointment = { id: 1, ...mockAppointmentDto };

        mockPrismaService.service.findUnique.mockResolvedValue(mockService);
        mockPrismaService.professional.findUnique.mockResolvedValue(mockProfessional);
        mockPrismaService.appointment.findFirst.mockResolvedValue(null);
        mockPrismaService.appointment.create.mockResolvedValue(mockAppointment);
        mockMailerService.sendEmailConfirmRegister.mockResolvedValue({});

        const result = await service.createAppointment(mockAppointmentDto);

        expect(result.statusCode).toBe(HttpStatus.CREATED);
        expect(result.data).toEqual(mockAppointment);
      });

      it('should throw error if time slot is already booked', async () => {
        mockPrismaService.service.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.professional.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaService.appointment.findFirst.mockResolvedValue({ id: 1 });

        await expect(service.createAppointment(mockAppointmentDto)).rejects.toThrow('This time slot is already booked');
      });
    });

    describe('findAllAppointments', () => {
      it('should return all appointments', async () => {
        const mockAppointments = [
          { id: 1, ...mockAppointmentDto },
          { id: 2, ...mockAppointmentDto }
        ];
        mockPrismaService.appointment.findMany.mockResolvedValue(mockAppointments);

        const result = await service.findAllAppointments();

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.data).toEqual(mockAppointments);
      });
    });
  });

  // Payment Tests
  describe('Payment CRUD', () => {
    describe('createPayment', () => {
      it('should create a payment successfully', async () => {
        const mockService = { id: 1, ...mockServiceDto };
        const mockPayment = { id: 1, ...mockPaymentDto };

        mockPrismaService.service.findUnique.mockResolvedValue(mockService);
        mockPrismaService.payment.create.mockResolvedValue(mockPayment);

        const result = await service.createPayment(mockPaymentDto);

        expect(result.statusCode).toBe(HttpStatus.CREATED);
        expect(result.data).toEqual(mockPayment);
      });

      it('should throw error if service not found', async () => {
        mockPrismaService.service.findUnique.mockResolvedValue(null);

        await expect(service.createPayment(mockPaymentDto)).rejects.toThrow('Service not found');
      });
    });

    describe('findAllPayments', () => {
      it('should return all payments', async () => {
        const mockPayments = [
          { id: 1, ...mockPaymentDto },
          { id: 2, ...mockPaymentDto }
        ];
        mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

        const result = await service.findAllPayments();

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.data).toEqual(mockPayments);
      });
    });
  });
});
