import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notifications: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByProfessional', () => {
    it('should return notifications for a professional', async () => {
      const mockNotifications = [
        {
          id: 1,
          title: 'Test Notification',
          description: 'Test Description',
          status: 'pending',
          professionalId: 1,
          clientId: 1,
          professional: { id: 1, name: 'John Doe' },
          client: { id: 1, name: 'Jane Doe' },
          create_at: new Date(),
          update_at: new Date(),
        },
      ];

      mockPrismaService.notifications.findMany.mockResolvedValue(mockNotifications);

      const result = await service.findByProfessional(1);

      expect(result).toEqual(mockNotifications);
      expect(prismaService.notifications.findMany).toHaveBeenCalledWith({
        where: { professionalId: 1 },
        include: {
          professional: true,
          client: true,
        },
      });
    });

    it('should handle errors when finding notifications', async () => {
      mockPrismaService.notifications.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findByProfessional(1)).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      const mockNotification = {
        id: 1,
        title: 'Test Notification',
        description: 'Test Description',
        status: 'pending',
        professionalId: 1,
        clientId: 1,
        create_at: new Date(),
        update_at: new Date(),
      };

      mockPrismaService.notifications.delete.mockResolvedValue(mockNotification);

      const result = await service.remove(1);

      expect(result).toEqual(mockNotification);
      expect(prismaService.notifications.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle errors when deleting notification', async () => {
      mockPrismaService.notifications.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.remove(1)).rejects.toThrow('Delete error');
    });
  });
});
