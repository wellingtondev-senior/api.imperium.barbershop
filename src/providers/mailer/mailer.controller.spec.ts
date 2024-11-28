import { Test, TestingModule } from '@nestjs/testing';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';
import { HttpStatus } from '@nestjs/common';
import { MailerTesteEmailDto } from './dto/mailer.dto';

jest.mock('../../guards/role.guard', () => ({
  RoleGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true
  }))
}));

describe('MailerController', () => {
  let controller: MailerController;
  let service: MailerService;

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

  const mockMailerService = {
    sendEmailTeste: jest.fn(),
    sendEmailConfirmRegister: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailerController],
      providers: [
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    controller = module.get<MailerController>(MailerController);
    service = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendEmailTeste', () => {
    it('should send a test email successfully', async () => {
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Email enviado com sucesso!',
      };

      mockMailerService.sendEmailTeste.mockResolvedValue(expectedResponse);

      const result = await controller.sendEmailTeste(mockMailerTesteEmailDto);

      expect(result).toEqual(expectedResponse);
      expect(mockMailerService.sendEmailTeste).toHaveBeenCalledWith(mockMailerTesteEmailDto);
    });

    it('should handle errors when sending test email fails', async () => {
      const errorMessage = 'Erro ao enviar email de teste';
      mockMailerService.sendEmailTeste.mockRejectedValue(new Error(errorMessage));

      await expect(controller.sendEmailTeste(mockMailerTesteEmailDto)).rejects.toThrow(Error);
      expect(mockMailerService.sendEmailTeste).toHaveBeenCalledWith(mockMailerTesteEmailDto);
    });
  });
});
