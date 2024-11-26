import { Test, TestingModule } from '@nestjs/testing';
import { SessionHashService } from './session-hash.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SessionHashService', () => {
  let service: SessionHashService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;

  const mockPrismaService = {
    sessionHash: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockLoggerService = {
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
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validadeHash', () => {
    const mockHash = 'test-hash';
    const mockUserId = '1';
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    
    const mockHashFind = {
      id: 1,
      hash: mockHash,
      userId: 1,
      status: true,
      validate: futureDate,
      action: 'confirm-register',
      user: { id: 1, email: 'test@example.com' },
    };

    it('should successfully validate a hash and update user status', async () => {
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(mockHashFind);
      mockPrismaService.user.update.mockResolvedValue({ id: 1, active: true });
      mockPrismaService.sessionHash.update.mockResolvedValue({ ...mockHashFind, status: false });

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: {
          hash: mockHash,
          valid: true,
          renewed: false,
          validate: mockHashFind.validate,
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { active: true },
      });

      expect(mockPrismaService.sessionHash.update).toHaveBeenCalledWith({
        where: { id: mockHashFind.id },
        data: { status: false },
      });
    });

    it('should renew an expired hash', async () => {
      const expiredHash = { ...mockHashFind, validate: pastDate };
      const renewedHash = { 
        ...expiredHash, 
        validate: expect.any(Date)
      };

      mockPrismaService.sessionHash.findFirst.mockResolvedValue(expiredHash);
      mockPrismaService.sessionHash.update.mockResolvedValue(renewedHash);

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: {
          hash: mockHash,
          valid: true,
          renewed: true,
          validate: expect.any(Date),
        },
      });

      expect(mockPrismaService.sessionHash.update).toHaveBeenCalledWith({
        where: { id: expiredHash.id },
        data: { validate: expect.any(Date) },
      });

      // Não deve atualizar o status do usuário quando apenas renova o hash
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should return not found when hash does not exist', async () => {
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(null);

      const result = await service.validadeHash(mockHash, mockUserId);

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Hash não encontrado',
      });
    });

    it('should handle errors during validation', async () => {
      const error = new Error('Database error');
      mockPrismaService.sessionHash.findFirst.mockRejectedValue(error);

      await expect(service.validadeHash(mockHash, mockUserId))
        .rejects
        .toThrow(new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE));

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('createHashConfirmRegister', () => {
    const mockUserId = 1;

    it('should create a new hash successfully', async () => {
      const mockCreatedHash = {
        id: 1,
        hash: expect.any(String),
        codigo: expect.any(Number),
        userId: mockUserId,
        status: true,
        action: 'confirm-register',
        validate: expect.any(Date),
      };

      mockPrismaService.sessionHash.create.mockResolvedValue(mockCreatedHash);

      const result = await service.createHashConfirmRegister(mockUserId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toMatchObject({
        userId: mockUserId,
        status: true,
        action: 'confirm-register',
      });
      expect(result.message.hash).toBeDefined();
      expect(result.message.codigo).toBeDefined();
      expect(result.message.validate).toBeDefined();
    });

    it('should handle errors during hash creation', async () => {
      const error = new Error('Database error');
      mockPrismaService.sessionHash.create.mockRejectedValue(error);

      await expect(service.createHashConfirmRegister(mockUserId))
        .rejects
        .toThrow(new HttpException('Erro ao criar o hash', HttpStatus.NOT_ACCEPTABLE));

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findByHash', () => {
    const mockHash = 'test-hash';
    const mockHashFind = {
      hash: mockHash,
      codigo: 123456,
      action: 'confirm-register',
      validate: new Date(Date.now() + 3600000),
      status: true,
    };

    it('should find a valid hash', async () => {
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(mockHashFind);

      const result = await service.findByHash(mockHash);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: {
          hash: mockHash,
          valid: true,
          codigo: mockHashFind.codigo,
          action: mockHashFind.action,
          validate: mockHashFind.validate,
        },
      });
    });

    it('should return false when hash is not found', async () => {
      mockPrismaService.sessionHash.findFirst.mockResolvedValue(null);

      const result = await service.findByHash(mockHash);

      expect(result).toBe(false);
    });

    it('should handle errors during hash search', async () => {
      const error = new Error('Database error');
      mockPrismaService.sessionHash.findFirst.mockRejectedValue(error);

      await expect(service.findByHash(mockHash))
        .rejects
        .toThrow(new HttpException('Erro ao buscar o hash', HttpStatus.NOT_ACCEPTABLE));

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredHashes', () => {
    it('should delete expired hashes', async () => {
      mockPrismaService.sessionHash.deleteMany.mockResolvedValue({ count: 1 });

      // Acessando o método privado através de qualquer
      await (service as any).cleanupExpiredHashes();

      expect(mockPrismaService.sessionHash.deleteMany).toHaveBeenCalledWith({
        where: {
          validate: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle errors during cleanup', async () => {
      const error = new Error('Database error');
      mockPrismaService.sessionHash.deleteMany.mockRejectedValue(error);

      // Acessando o método privado através de qualquer
      await (service as any).cleanupExpiredHashes();

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
