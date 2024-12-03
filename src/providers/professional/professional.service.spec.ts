import { Test, TestingModule } from '@nestjs/testing';
import { ProfessionalService } from './professional.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { ProfessionalDto, ProfessionalStatus } from './dto/professional.dto';
import { Role } from '../../enums/role.enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { CredenciaisService } from '../../modulos/credenciais/credenciais.service';

describe('ProfessionalService', () => {
  let service: ProfessionalService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let sessionHashService: SessionHashService;
  let mailerService: MailerService;
  let credenciaisService: CredenciaisService;

  const mockProfessionalDto: ProfessionalDto = {
    // Campos obrigatórios
    userId: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'password123',
    document: '123.456.789-00',
    type_doc: 'CPF',
    status: ProfessionalStatus.ACTIVE,
    availability: 'available',

    // Campos opcionais
    id: 1,
    avatarUrl: 'https://example.com/avatar.jpg',
    experienceYears: 5,
    specialties: ['corte masculino', 'barba'],
    rating: 4.5,
    location: 'São Paulo, SP',
    bio: 'Profissional experiente em barbearia',
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
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ ...mockProfessionalDto }),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        email: mockProfessionalDto.email,
        password: 'hashedPassword',
        role: Role.PROFESSIONAL,
        name: mockProfessionalDto.name,
      }),
      delete: jest.fn(),
    },
    credenciais: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workingHours: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn(),
      update: jest.fn(),
    },
    socialMedia: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn(),
      update: jest.fn(),
    },
    schedule: {
      findFirst: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
    service: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockSessionHashService = {
    generateHashAuthentication: jest.fn(),
  };

  const mockMailerService = {
    sendEmailConfirmRegister: jest.fn(),
  };

  const mockCredenciaisService = {
    delete: jest.fn().mockResolvedValue({
      statusCode: HttpStatus.OK,
      message: 'Credenciais removidas com sucesso'
    }),
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
        {
          provide: CredenciaisService,
          useValue: mockCredenciaisService,
        },
      ],
    }).compile();

    service = module.get<ProfessionalService>(ProfessionalService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
    sessionHashService = module.get<SessionHashService>(SessionHashService);
    mailerService = module.get<MailerService>(MailerService);
    credenciaisService = module.get<CredenciaisService>(CredenciaisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new professional successfully', async () => {
      const mockUser = { 
        id: 1, 
        email: mockProfessionalDto.email,
        name: mockProfessionalDto.name,
        role: Role.PROFESSIONAL, 
        active: false 
      };
      
      const mockProfessional = {
        id: 1,
        ...mockProfessionalDto,
        create_at: new Date(),
        update_at: new Date(),
        user: mockUser,
        workingHours: mockProfessionalDto.workingHours,
        socialMedia: mockProfessionalDto.socialMedia
      };

      mockPrismaService.professional.findMany.mockResolvedValue([]);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.professional.create.mockResolvedValue(mockProfessional);
      mockPrismaService.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrismaService.credenciais.create.mockResolvedValue({});
      mockSessionHashService.generateHashAuthentication.mockResolvedValue('mock-hash');
      mockMailerService.sendEmailConfirmRegister.mockResolvedValue(undefined);

      const result = await service.create(mockProfessionalDto);

      expect(result).toEqual({
        statusCode: HttpStatus.ACCEPTED,
        message: {
          email: mockUser.email,
          create_at: mockProfessional.create_at,
          update_at: mockProfessional.update_at,
          role: mockUser.role,
          active: mockUser.active,
          user: [mockProfessional]
        }
      });

      expect(mockPrismaService.professional.create).toHaveBeenCalled();
      expect(mockMailerService.sendEmailConfirmRegister).toHaveBeenCalled();
    });

    it('should return error if professional email already exists', async () => {
      mockPrismaService.professional.findMany.mockResolvedValue([{ id: 1, email: mockProfessionalDto.email }]);

      await expect(service.create(mockProfessionalDto)).rejects.toThrow(
        new HttpException({
          statusCode: HttpStatus.CONFLICT,
          message: 'Profissional já cadastrado',
          error: `O profissional com o email ${mockProfessionalDto.email} já está cadastrado no sistema. Por favor, utilize outro email ou faça login.`
        }, HttpStatus.CONFLICT)
      );
    });
  });

  describe('findAll', () => {
    it('should return all professionals', async () => {
      const mockProfessionals = [
        { id: 1, ...mockProfessionalDto },
        { id: 2, ...mockProfessionalDto, email: 'jane@example.com' },
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
      const mockProfessional = { id: 1, ...mockProfessionalDto };
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
      const mockUpdatedProfessional = { id: 1, ...updateDto };

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
    it('should soft delete a professional with existing schedules', async () => {
      const mockProfessional = { id: 1, userId: 1, ...mockProfessionalDto };
      const mockSchedule = { id: 1, professionalId: 1 };
      
      mockPrismaService.schedule.findFirst.mockResolvedValue(mockSchedule);
      mockPrismaService.professional.update.mockResolvedValue({
        ...mockProfessional,
        status: ProfessionalStatus.INACTIVE,
        isAvailable: false
      });

      const result = await service.remove(1, 1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe("Professional marked as inactive due to existing schedules");
      expect(mockPrismaService.schedule.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.professional.update).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });

    it('should hard delete a professional without schedules', async () => {
      const mockProfessional = { id: 1, userId: 1, ...mockProfessionalDto };
      
      mockPrismaService.schedule.findFirst.mockResolvedValue(null);
      mockPrismaService.workingHours.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.socialMedia.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.service.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.professional.delete.mockResolvedValue(mockProfessional);
      mockPrismaService.user.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1, 1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toEqual(mockProfessional);
      expect(mockPrismaService.workingHours.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.socialMedia.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.service.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.professional.delete).toHaveBeenCalled();
      expect(mockPrismaService.user.delete).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a professional by email', async () => {
      const mockProfessional = { id: 1, ...mockProfessionalDto };
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
