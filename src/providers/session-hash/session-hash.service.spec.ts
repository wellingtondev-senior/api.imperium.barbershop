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
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
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

  describe('generateHashAuthentication', () => {
    const mockEmail = 'test@example.com';

    it('should generate a hash successfully', async () => {
      const mockSessionHash = {
        id: 1,
        hash: 'mock-hash',
        email: mockEmail,
        validate: new Date(Date.now() + 3600000), // 1 hour in future
        create_at: new Date(),
        update_at: new Date(),
      };

      mockPrismaService.sessionHash.create.mockResolvedValue(mockSessionHash);

      const result = await service.generateHashAuthentication(mockEmail);

      expect(result).toBe(mockSessionHash.hash);
      expect(mockPrismaService.sessionHash.create).toHaveBeenCalled();
    });

    it('should handle errors during hash generation', async () => {
      mockPrismaService.sessionHash.create.mockRejectedValue(new Error('Database error'));

      await expect(service.generateHashAuthentication(mockEmail)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('validateHash', () => {
    const mockHash = 'test-hash';
    const mockUserId = 1;
    const mockEmail = 'test@example.com';

    it('should validate hash successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: mockUserId, email: mockEmail });
      mockPrismaService.sessionHash.findFirst.mockResolvedValue({
        id: 1,
        hash: mockHash,
        email: mockEmail,
        validate: new Date(Date.now() + 3600000), // 1 hour in future
        create_at: new Date(),
        update_at: new Date(),
      });
      mockPrismaService.sessionHash.delete.mockResolvedValue({ id: 1, hash: mockHash, email: mockEmail, validate: new Date(Date.now() + 3600000), create_at: new Date(), update_at: new Date() });

      const result = await service.validateHash(mockHash, mockUserId);

      expect(result).toBe(true);
      expect(mockPrismaService.sessionHash.delete).toHaveBeenCalled();
    });

    it('should return false when hash is expired', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: mockUserId, email: mockEmail });
      mockPrismaService.sessionHash.findFirst.mockResolvedValue({
        id: 1,
        hash: mockHash,
        email: mockEmail,
        validate: new Date(Date.now() - 3600000), // 1 hour in past
        create_at: new Date(),
        update_at: new Date(),
      });

      const result = await service.validateHash(mockHash, mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when hash does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: mockUserId, email: mockEmail });
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(null);

      const result = await service.validateHash(mockHash, mockUserId);

      expect(result).toBe(false);
    });

    it('should handle validation errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: mockUserId, email: mockEmail });
      mockPrismaService.sessionHash.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.validateHash(mockHash, mockUserId)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
