import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalService } from './professional.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { ProfessionalDto } from './dto/professional.dto';
import { Role } from '../../enums/role.enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';

describe('ProfessionalService', () => {
  let service: ProfessionalService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let sessionHashService: SessionHashService;
  let mailerService: MailerService;

  const mockProfessionalDto: ProfessionalDto = {
    // Campos obrigatórios
    userId: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'password123',
    document: '123.456.789-00',
    type_doc: 'CPF',

    // Campos opcionais
    id: '1',
    avatarUrl: 'https://example.com/avatar.jpg',
    avatar: 'https://example.com/avatar.jpg',
    cpf: '123.456.789-00',
    experienceYears: 5,
    specialties: ['corte masculino', 'barba'],
    rating: 4.5,
    location: 'São Paulo, SP',
    bio: 'Profissional experiente em barbearia',
    isAvailable: true,
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '18:00' },
      sunday: { start: '09:00', end: '18:00' }
    },
    socialMedia: {
      instagram: 'john_barber',
      facebook: 'john.barber',
      twitter: 'johnbarber',
      linkedin: 'johnbarber'
    }
  };

  const mockPrismaService = {
    professional: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    credenciais: {
      create: jest.fn(),
    },
    workingHours: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    socialMedia: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
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
        ProfessionalService,
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

    service = module.get<ProfessionalService>(ProfessionalService);
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
    it('should create a new professional successfully', async () => {
      const mockUser = { id: 1, role: Role.PROFESSIONAL, active: false };
      const mockProfessional = {
        id: '1',
        ...mockProfessionalDto,
        create_at: new Date(),
        update_at: new Date(),
      };

      mockPrismaService.professional.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.professional.create.mockResolvedValue(mockProfessional);
      mockPrismaService.credenciais.create.mockResolvedValue({});
      mockMailerService.sendEmailConfirmRegister.mockResolvedValue({});

      const result = await service.create(mockProfessionalDto);

      expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
      expect(result.message).toEqual({
        email: mockProfessionalDto.email,
        create_at: mockProfessional.create_at,
        update_at: mockProfessional.update_at,
        role: mockUser.role,
        active: mockUser.active,
        user: [mockProfessional]
      });
      expect(mockPrismaService.professional.create).toHaveBeenCalled();
      expect(mockMailerService.sendEmailConfirmRegister).toHaveBeenCalled();
    });

    it('should return error if professional email already exists', async () => {
      mockPrismaService.professional.findMany.mockResolvedValue([{ id: '1', email: mockProfessionalDto.email }]);

      const result = await service.create(mockProfessionalDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Esse email já está cadastrado');
    });
  });

  describe('findAll', () => {
    it('should return all professionals', async () => {
      const mockProfessionals = [
        { id: '1', ...mockProfessionalDto },
        { id: '2', ...mockProfessionalDto, email: 'jane@example.com' },
      ];

      mockPrismaService.professional.findMany.mockResolvedValue(mockProfessionals);

      const result = await service.findAll();

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockProfessionals);
    });

    it('should handle errors when finding all professionals', async () => {
      mockPrismaService.professional.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a professional by id', async () => {
      const mockProfessional = { id: '1', ...mockProfessionalDto };
      mockPrismaService.professional.findUnique.mockResolvedValue(mockProfessional);

      const result = await service.findOne(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockProfessional);
    });

    it('should throw error if professional not found', async () => {
      mockPrismaService.professional.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a professional successfully', async () => {
      const updateDto = { ...mockProfessionalDto, name: 'John Updated' };
      const mockUpdatedProfessional = { id: '1', ...updateDto };

      mockPrismaService.professional.update.mockResolvedValue(mockUpdatedProfessional);

      const result = await service.update(1, updateDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockUpdatedProfessional);
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle errors when updating professional', async () => {
      mockPrismaService.professional.update.mockRejectedValue(new Error('Update error'));

      await expect(service.update(1, mockProfessionalDto)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a professional successfully', async () => {
      const mockProfessional = { id: '1', ...mockProfessionalDto };
      
      mockPrismaService.workingHours.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.socialMedia.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.professional.delete.mockResolvedValue(mockProfessional);

      const result = await service.remove(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockProfessional);
      expect(mockPrismaService.workingHours.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.socialMedia.deleteMany).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should handle errors when removing professional', async () => {
      mockPrismaService.professional.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.remove(1)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a professional by email', async () => {
      const mockProfessional = { id: '1', ...mockProfessionalDto };
      mockPrismaService.professional.findUnique.mockResolvedValue(mockProfessional);

      const result = await service.findByEmail(mockProfessionalDto.email);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockProfessional);
    });

    it('should handle errors when finding professional by email', async () => {
      mockPrismaService.professional.findUnique.mockRejectedValue(new Error('Find error'));

      await expect(service.findByEmail(mockProfessionalDto.email)).rejects.toThrow(HttpException);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
