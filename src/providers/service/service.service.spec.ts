import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { HttpStatus } from '@nestjs/common';

describe('ServiceService', () => {
  let service: ServiceService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;

  const mockServiceDto = {
    name: 'Corte de Cabelo',
    description: 'Corte masculino moderno',
    duration: 30,
    price: 50.0,
    professionalId: 1,
    active: true
  };

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schedule: {
      findFirst: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerCustomService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new service successfully', async () => {
      const mockService = { id: 1, ...mockServiceDto };
      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create(mockServiceDto);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toEqual(mockService);
      expect(mockPrismaService.service.create).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle errors when creating service', async () => {
      mockPrismaService.service.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockServiceDto)).rejects.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      const mockServices = [{ id: 1, ...mockServiceDto }];
      mockPrismaService.service.findMany.mockResolvedValue(mockServices);

      const result = await service.findAll();

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockServices);
    });

    it('should handle errors when finding all services', async () => {
      mockPrismaService.service.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      const mockService = { id: 1, ...mockServiceDto };
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockService);
    });

    it('should throw error if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow('Service not found');
    });
  });

  describe('findByProfessional', () => {
    it('should return services by professional id', async () => {
      const mockServices = [{ id: 1, ...mockServiceDto }];
      mockPrismaService.service.findMany.mockResolvedValue(mockServices);

      const result = await service.findByProfessional(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockServices);
    });
  });

  describe('update', () => {
    it('should update a service successfully', async () => {
      const mockService = { id: 1, ...mockServiceDto };
      mockPrismaService.service.update.mockResolvedValue(mockService);

      const result = await service.update(1, mockServiceDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockService);
      expect(mockPrismaService.service.update).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle errors when updating service', async () => {
      mockPrismaService.service.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update(1, mockServiceDto)).rejects.toThrow();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a service with existing schedules', async () => {
      const mockService = { id: 1, ...mockServiceDto };
      mockPrismaService.schedule.findFirst.mockResolvedValue({ id: 1 });
      mockPrismaService.service.update.mockResolvedValue({
        ...mockService,
        active: false,
      });

      const result = await service.remove(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Service marked as inactive due to existing schedules');
      expect(mockPrismaService.service.update).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should hard delete a service without schedules', async () => {
      const mockService = { id: 1, ...mockServiceDto };
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.service.delete.mockResolvedValue(mockService);

      const result = await service.remove(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockService);
      expect(mockPrismaService.service.delete).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });
  });
});
