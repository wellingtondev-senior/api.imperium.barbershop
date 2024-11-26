import { Test, TestingModule } from '@nestjs/testing';
import { SessionHashService } from './session-hash.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SessionHashService', () => {
  let service: SessionHashService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sessionHash: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionHashService,
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

    service = module.get<SessionHashService>(SessionHashService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHash', () => {
    const mockUserId = 1;
    const mockAction = 'confirm-register';

    it('should create a hash successfully', async () => {
      const mockSessionHash = {
        id: 1,
        hash: 'mock-hash',
        codigo: 123456,
        action: mockAction,
        status: true,
        validate: new Date(),
        userId: mockUserId,
      };

      mockPrismaService.sessionHash.create.mockResolvedValue(mockSessionHash);

      const result = await service.createHash(mockUserId, mockAction);

      expect(result).toEqual(mockSessionHash);
      expect(mockPrismaService.sessionHash.create).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle errors during hash creation', async () => {
      mockPrismaService.sessionHash.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createHash(mockUserId, mockAction)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('validadeHash', () => {
    const mockHash = 'test-hash';
    const mockUserId = '1';

    it('should validate hash successfully', async () => {
      const mockSessionHash = {
        id: 1,
        hash: mockHash,
        codigo: 123456,
        action: 'confirm-register',
        status: true,
        validate: new Date(Date.now() + 3600000), // 1 hour in future
        userId: 1,
        user: {
          id: 1,
          email: 'test@example.com',
        },
      };

      mockPrismaService.sessionHash.findFirst.mockResolvedValue(mockSessionHash);
      mockPrismaService.user.update.mockResolvedValue({ id: 1, active: true });
      mockPrismaService.sessionHash.update.mockResolvedValue({ ...mockSessionHash, status: false });

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(typeof result.message === 'object' && result.message.valid).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.sessionHash.update).toHaveBeenCalled();
    });

    it('should handle expired hash', async () => {
      const mockSessionHash = {
        id: 1,
        hash: mockHash,
        codigo: 123456,
        action: 'confirm-register',
        status: true,
        validate: new Date(Date.now() - 3600000), // 1 hour in past
        userId: 1,
        user: {
          id: 1,
          email: 'test@example.com',
        },
      };

      mockPrismaService.sessionHash.findFirst.mockResolvedValue(mockSessionHash);

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(typeof result.message === 'object' && result.message.renewed).toBe(true);
    });

    it('should return not found when hash does not exist', async () => {
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(null);

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('Hash não encontrado');
    });

    it('should handle validation errors', async () => {
      mockPrismaService.sessionHash.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.validadeHash(mockHash, mockUserId)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
