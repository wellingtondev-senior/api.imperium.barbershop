import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SendMailProducerService } from '../../modulos/jobs/sendmail/sendmail.producer.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { 
  MailerTesteEmailDto,
  MailerConfirmationRegisterEmailDto,
  PaymentSuccessEmailDto,
  PaymentFailedEmailDto
} from './dto/mailer.dto';

describe('MailerService', () => {
  let service: MailerService;
  let prismaService: PrismaService;
  let loggerService: LoggerCustomService;
  let sendMailProducerService: SendMailProducerService;
  let sessionHashService: SessionHashService;

  const mockMailerTesteEmailDto: MailerTesteEmailDto = {
    to: 'test@example.com',
    subject: 'Test Email',
    message: 'This is a test email',
    context: {
      name: 'Test User',
      email: 'test@example.com',
      hash: 'test-hash'
    }
  };

  const mockMailerConfirmationRegisterEmailDto: MailerConfirmationRegisterEmailDto = {
    to: 'test@example.com',
    subject: 'Confirmation Email',
    template: 'confirmation-register',
    context: {
      name: 'Test User',
      email: 'test@example.com',
      hash: 'test-hash'
    }
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  const mockSendMailProducerService = {
    sendEmailTeste: jest.fn(),
    sendEmailConfirmationRegister: jest.fn(),
    sendPaymentSuccessEmail: jest.fn(),
    sendPaymentFailedEmail: jest.fn(),
  };

  const mockSessionHashService = {
    generateHash: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerCustomService,
          useValue: mockLoggerService,
        },
        {
          provide: SendMailProducerService,
          useValue: mockSendMailProducerService,
        },
        {
          provide: SessionHashService,
          useValue: mockSessionHashService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerCustomService>(LoggerCustomService);
    sendMailProducerService = module.get<SendMailProducerService>(SendMailProducerService);
    sessionHashService = module.get<SessionHashService>(SessionHashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailTeste', () => {
    it('should send a test email successfully', async () => {
      mockSendMailProducerService.sendEmailTeste.mockResolvedValue(undefined);

      const result = await service.sendEmailTeste(mockMailerTesteEmailDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Email enviado com sucesso!',
      });
      expect(mockSendMailProducerService.sendEmailTeste).toHaveBeenCalledWith(mockMailerTesteEmailDto);
    });

    it('should throw an error when sending test email fails', async () => {
      mockSendMailProducerService.sendEmailTeste.mockRejectedValue(new Error('Failed to send email'));

      await expect(service.sendEmailTeste(mockMailerTesteEmailDto)).rejects.toThrow(
        new HttpException('Erro ao enviar email de teste', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('sendEmailConfirmRegister', () => {
    it('should send a confirmation register email successfully', async () => {
      mockSendMailProducerService.sendEmailConfirmationRegister.mockResolvedValue(undefined);

      const result = await service.sendEmailConfirmRegister(mockMailerConfirmationRegisterEmailDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Email de confirmação enviado com sucesso',
      });
      expect(mockSendMailProducerService.sendEmailConfirmationRegister).toHaveBeenCalledWith(
        mockMailerConfirmationRegisterEmailDto,
      );
    });

    it('should throw an error when sending confirmation email fails', async () => {
      mockSendMailProducerService.sendEmailConfirmationRegister.mockRejectedValue(
        new Error('Failed to send email'),
      );

      await expect(
        service.sendEmailConfirmRegister(mockMailerConfirmationRegisterEmailDto),
      ).rejects.toThrow(
        new HttpException('Erro ao enviar email de confirmação', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
