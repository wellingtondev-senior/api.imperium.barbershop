import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { SMSProducer } from 'src/modulos/jobs/sms/sms.producer';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
import { ReceivePayloadApiDto } from 'src/modulos/jobs/sms/dto/payload-api.dto';

describe('SmsService', () => {
  let service: SmsService;
  let smsProducer: SMSProducer;
  let loggerService: LoggerCustomService;

  const mockSMSProducer = {
    sendSmsPayment: jest.fn(),
  };

  const mockLoggerService = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: SMSProducer,
          useValue: mockSMSProducer,
        },
        {
          provide: LoggerCustomService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    smsProducer = module.get<SMSProducer>(SMSProducer);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSms', () => {
    it('should successfully send SMS', async () => {
      const mockPayload: ReceivePayloadApiDto = {
        to: '+5521979299562',
        client: 'John Doe',
        service: [
          { name: 'Corte de Cabelo', price: 50.00 }
        ],
        link: 'https://imperiumbarbershop.com.br',
      };

      const expectedMessage = `Hello John Doe!\n\nYour appointment has been confirmed ✅\n\n📅 Services:\n• Corte de Cabelo: $ 50.00\n\n💰 Total: $ 50.00\n\nTo view your appointment details, please visit:\nhttps://imperiumbarbershop.com.br`;
      
      const expectedPayload = {
        to: '+5521979299562',
        message: expectedMessage
      };

      mockSMSProducer.sendSmsPayment.mockResolvedValueOnce({
        success: true,
        message: 'SMS adicionado à fila com sucesso',
      });

      const result = await service.sendSms(mockPayload);

      expect(result).toEqual({
        success: true,
        message: 'SMS adicionado à fila com sucesso',
      });
      expect(mockSMSProducer.sendSmsPayment).toHaveBeenCalledWith(expectedPayload);
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });

    it('should handle errors when sending SMS fails', async () => {
      const mockPayload: ReceivePayloadApiDto = {
        to: '+5521979299562',
        client: 'John Doe',
        service: [
          { name: 'Corte de Cabelo', price: 50.00 }
        ],
        link: 'https://imperiumbarbershop.com.br',
      };

      const error = new Error('Failed to send SMS');
      mockSMSProducer.sendSmsPayment.mockRejectedValueOnce(error);

      await expect(service.sendSms(mockPayload)).rejects.toThrow('Erro ao enviar SMS: Failed to send SMS');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
