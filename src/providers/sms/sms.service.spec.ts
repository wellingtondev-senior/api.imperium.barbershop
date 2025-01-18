import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { SMSProducer } from 'src/modulos/jobs/sms/sms.producer';
import { AppointmentDataDto } from './dto/sms.payload.dto';

describe('SmsService', () => {
  let service: SmsService;
  let smsProducer: SMSProducer;

  const mockSMSProducer = {
    sendSms: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: SMSProducer,
          useValue: mockSMSProducer
        }
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    smsProducer = module.get<SMSProducer>(SMSProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendAppointmentMessage', () => {
    it('should send SMS successfully', async () => {
      const mockPayload: AppointmentDataDto = {
        to: '+5511999999999',
        client: 'John Doe',
        service: [{
          name: 'Haircut',
          price: 50
        }],
        appointmentDate: new Date(),
        barberName: 'Jane Smith',
        link: 'https://example.com/confirmation/123'
      };

      mockSMSProducer.sendSms.mockResolvedValue({
        success: true,
        message: 'SMS sent successfully'
      });

      const result = await service.sendAppointmentMessage(mockPayload);

      expect(result).toEqual({
        success: true,
        message: 'SMS sent successfully'
      });
      expect(mockSMSProducer.sendSms).toHaveBeenCalled();
    });

    it('should handle SMS sending failure', async () => {
      const mockPayload: AppointmentDataDto = {
        to: '+5511999999999',
        client: 'John Doe',
        service: [{
          name: 'Haircut',
          price: 50
        }],
        appointmentDate: new Date(),
        barberName: 'Jane Smith',
        link: 'https://example.com/confirmation/123'
      };

      mockSMSProducer.sendSms.mockRejectedValue(new Error('Failed to send SMS'));

      await expect(service.sendAppointmentMessage(mockPayload))
        .rejects.toThrow('Failed to send SMS');
    });
  });
});
