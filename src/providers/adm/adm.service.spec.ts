import { Test, TestingModule } from '@nestjs/testing';
import { AdmService } from './adm.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { AdmDto } from './dto/adm.dto';
import { Role } from '../../enums/role.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AdmService', () => {
  let service: AdmService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let sessionHashService: SessionHashService;
  let mailerService: MailerService;

  const mockAdmDto: AdmDto = {
    name: 'Admin Test',
    email: 'admin@example.com',
    password: 'password123',
    userId: 1
  };

  const mockPrismaService = {
    adm: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    credenciais: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        AdmService,
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

    service = module.get<AdmService>(AdmService);
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

  describe('create', () => {
    it('should create a new admin successfully', async () => {
      const mockUser = { id: 1, role: Role.ADM, active: false };
      const mockAdmin = {
        id: 1,
        name: mockAdmDto.name,
        email: mockAdmDto.email,
        userId: mockUser.id,
        create_at: new Date(),
        update_at: new Date(),
      };

      mockPrismaService.adm.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.adm.create.mockResolvedValue(mockAdmin);
      mockPrismaService.credenciais.create.mockResolvedValue({});
      mockMailerService.sendEmailConfirmRegister.mockResolvedValue({});

      const result = await service.create(mockAdmDto);

      expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
      expect(result.message).toEqual({
        email: mockAdmDto.email,
        create_at: mockAdmin.create_at,
        update_at: mockAdmin.update_at,
        role: mockUser.role,
        active: mockUser.active,
        user: [mockAdmin]
      });
      expect(mockPrismaService.adm.create).toHaveBeenCalled();
      expect(mockMailerService.sendEmailConfirmRegister).toHaveBeenCalled();
    });

    it('should return error if admin email already exists', async () => {
      mockPrismaService.adm.findMany.mockResolvedValue([{ id: 1, email: mockAdmDto.email }]);

      const result = await service.create(mockAdmDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Esse email já está cadastrado');
    });

    it('should handle errors during admin creation', async () => {
      mockPrismaService.adm.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockAdmDto)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all admins', async () => {
      const mockAdmins = [
        { id: 1, ...mockAdmDto, user: { role: Role.ADM } },
        { id: 2, ...mockAdmDto, email: 'admin2@example.com', user: { role: Role.ADM } },
      ];

      mockPrismaService.adm.findMany.mockResolvedValue(mockAdmins);

      const result = await service.findAll();

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockAdmins);
    });

    it('should handle errors when finding all admins', async () => {
      mockPrismaService.adm.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an admin by id', async () => {
      const mockAdmin = { id: 1, ...mockAdmDto, user: { role: Role.ADM } };
      mockPrismaService.adm.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.findOne(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockAdmin);
    });

    it('should throw error if admin not found', async () => {
      mockPrismaService.adm.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Administrador não encontrado');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an admin successfully', async () => {
      const mockAdmin = { id: 1, ...mockAdmDto };
      const updateDto = { ...mockAdmDto, name: 'Updated Name' };
      const mockUpdatedAdmin = { ...mockAdmin, name: updateDto.name };

      mockPrismaService.adm.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.adm.update.mockResolvedValue(mockUpdatedAdmin);

      const result = await service.update(1, updateDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockUpdatedAdmin);
    });

    it('should update admin password when provided', async () => {
      const mockAdmin = { id: 1, ...mockAdmDto };
      const updateDto = { ...mockAdmDto, password: 'newpassword123' };

      mockPrismaService.adm.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.adm.update.mockResolvedValue(mockAdmin);
      mockPrismaService.credenciais.update.mockResolvedValue({});

      const result = await service.update(1, updateDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(mockPrismaService.credenciais.update).toHaveBeenCalled();
    });

    it('should throw error if admin not found', async () => {
      mockPrismaService.adm.findUnique.mockResolvedValue(null);

      await expect(service.update(999, mockAdmDto)).rejects.toThrow('Administrador não encontrado');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an admin successfully', async () => {
      const mockAdmin = { 
        id: 1, 
        ...mockAdmDto,
        userId: 1,
        user: { id: 1, role: Role.ADM }
      };

      mockPrismaService.adm.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.credenciais.delete.mockResolvedValue({});
      mockPrismaService.adm.delete.mockResolvedValue(mockAdmin);
      mockPrismaService.user.delete.mockResolvedValue({});

      const result = await service.remove(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockAdmin);
      expect(mockPrismaService.credenciais.delete).toHaveBeenCalled();
      expect(mockPrismaService.user.delete).toHaveBeenCalled();
    });

    it('should throw error if admin not found', async () => {
      mockPrismaService.adm.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow('Administrador não encontrado');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle errors during admin removal', async () => {
      mockPrismaService.adm.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(1)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
