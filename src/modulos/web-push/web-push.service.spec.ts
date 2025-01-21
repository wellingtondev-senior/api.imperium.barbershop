import { Test, TestingModule } from '@nestjs/testing';
import { WebPushService } from './web-push.service';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

jest.mock('web-push');

describe('WebPushService', () => {
  let service: WebPushService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    pushSubscription: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebPushService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebPushService>(WebPushService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveSubscription', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    it('should save push subscription successfully', async () => {
      const mockUserId = '1';
      const mockCreatedSubscription = {
        id: 1,
        userId: mockUserId,
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
        create_at: new Date(),
        update_at: new Date(),
      };

      mockPrismaService.pushSubscription.create.mockResolvedValue(mockCreatedSubscription);

      const result = await service.saveSubscription(mockUserId, mockSubscription);

      expect(result).toEqual(mockCreatedSubscription);
      expect(prismaService.pushSubscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          endpoint: mockSubscription.endpoint,
          p256dh: mockSubscription.keys.p256dh,
          auth: mockSubscription.keys.auth,
        },
      });
    });

    it('should handle database error when saving subscription', async () => {
      const mockUserId = '1';
      mockPrismaService.pushSubscription.create.mockRejectedValue(new Error('Database error'));

      await expect(service.saveSubscription(mockUserId, mockSubscription)).rejects.toThrow('Database error');
    });
  });

  describe('sendNotification', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    const mockPayload = {
      title: 'Test Notification',
      body: 'Test message',
      icon: '/icon.png',
      data: {
        url: '/test',
      },
    };

    it('should send notification successfully', async () => {
      (webPush.sendNotification as jest.Mock).mockResolvedValue(undefined);

      const result = await service.sendNotification(mockSubscription, mockPayload);

      expect(result).toBe(true);
      expect(webPush.sendNotification).toHaveBeenCalledWith(
        mockSubscription,
        JSON.stringify(mockPayload),
      );
    });

    it('should handle notification error', async () => {
      const mockError = new Error('Failed to send notification');
      (webPush.sendNotification as jest.Mock).mockRejectedValue(mockError);

      const result = await service.sendNotification(mockSubscription, mockPayload);

      expect(result).toBe(false);
    });
  });

  describe('sendNotificationToUser', () => {
    const mockUserId = '1';
    const mockPayload = {
      title: 'Test Notification',
      body: 'Test message',
    };

    it('should send notification to user successfully', async () => {
      const mockSubscription = {
        endpoint: 'test-endpoint',
        p256dh: 'test-p256dh',
        auth: 'test-auth',
      };

      mockPrismaService.pushSubscription.findFirst.mockResolvedValue(mockSubscription);
      (webPush.sendNotification as jest.Mock).mockResolvedValue(undefined);

      const result = await service.sendNotificationToUser(mockUserId, mockPayload);

      expect(result).toBe(true);
      expect(prismaService.pushSubscription.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should throw error if user has no subscription', async () => {
      mockPrismaService.pushSubscription.findFirst.mockResolvedValue(null);

      await expect(service.sendNotificationToUser(mockUserId, mockPayload))
        .rejects.toThrow('Usuário não possui inscrição para notificações push');
    });

    it('should handle database error when finding subscription', async () => {
      mockPrismaService.pushSubscription.findFirst.mockRejectedValue(new Error('Database error'));

      await expect(service.sendNotificationToUser(mockUserId, mockPayload))
        .rejects.toThrow('Database error');
    });
  });

  describe('removeSubscription', () => {
    it('should remove subscription successfully', async () => {
      const mockUserId = '1';
      const mockDeleteResult = { count: 1 };

      mockPrismaService.pushSubscription.deleteMany.mockResolvedValue(mockDeleteResult);

      const result = await service.removeSubscription(mockUserId);

      expect(result).toEqual(mockDeleteResult);
      expect(prismaService.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should handle database error when removing subscription', async () => {
      const mockUserId = '1';
      mockPrismaService.pushSubscription.deleteMany.mockRejectedValue(new Error('Database error'));

      await expect(service.removeSubscription(mockUserId)).rejects.toThrow('Database error');
    });
  });

  describe('getVapidPublicKey', () => {
    it('should return VAPID public key', () => {
      const result = service.getVapidPublicKey();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});
