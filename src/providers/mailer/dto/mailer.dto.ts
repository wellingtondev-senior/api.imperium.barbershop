export class MailerDto { }
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsNotEmpty, IsDate, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { AdmDto } from 'src/providers/adm/dto/adm.dto';

export class MailerTesteEmailDto {

  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string; // Endereço de e-mail do destinatário

  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  subject: string; // Assunto do e-mail

  @ApiProperty({ example: 'Este é um teste de envio de e-mail.' })
  @IsString()
  @IsNotEmpty()
  message: string; // Corpo da mensagem do e-mail
}

export class MailerConfirmationRegisterEmailDto {
  
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  destino: string;// Endereço de e-mail do destinatário


  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  assunto: string; // Assunto do e-mail


  @ApiProperty({ example: '000000' })
  @IsInt()
  @IsNotEmpty()
  codigo: number;


  @ApiProperty({ example: '3g5Hk6l389cFw34S' })
  @IsString()
  @IsNotEmpty()
  hash: string;


  @ApiProperty({ example: 'Este é um teste de envio de e-mail.' })
  @IsString()
  @IsNotEmpty()
  name: string;
  // Corpo da mensagem do e-mail
}

export class MailerPaymentConfirmationDto {
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'payment-confirmation' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({ example: { serviceName: 'Serviço de teste', professionalName: 'Profissional de teste', date: new Date(), amount: 100.00 } })
  context: {
    @IsString()
    @IsNotEmpty()
    serviceName: string;

    @IsString()
    @IsNotEmpty()
    professionalName: string;

    @IsDate()
    @IsNotEmpty()
    date: Date;

    @IsInt()
    @IsNotEmpty()
    amount: number;
  };
}

export class PaymentEmailBaseDto {
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Pagamento Confirmado' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'payment-success' })
  @IsString()
  @IsNotEmpty()
  template: string;
}

export class PaymentSuccessEmailDto extends PaymentEmailBaseDto {
  @ApiProperty({
    example: {
      serviceName: 'Corte de Cabelo',
      professionalName: 'João Silva',
      clientName: 'Maria Santos',
      date: new Date(),
      amount: 50.00,
      appointmentId: 123,
      paymentId: 456,
    }
  })
  context: {
    @IsString()
    @IsNotEmpty()
    serviceName: string;

    @IsString()
    @IsNotEmpty()
    professionalName: string;

    @IsString()
    @IsNotEmpty()
    clientName: string;

    @IsDate()
    @IsNotEmpty()
    date: Date;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsNumber()
    @IsNotEmpty()
    appointmentId: number;

    @IsNumber()
    @IsOptional()
    paymentId?: number;
  };
}

export class PaymentFailedEmailDto extends PaymentEmailBaseDto {
  @ApiProperty({
    example: {
      serviceName: 'Corte de Cabelo',
      professionalName: 'João Silva',
      clientName: 'Maria Santos',
      date: new Date(),
      amount: 50.00,
      appointmentId: 123,
      paymentId: 456,
      errorMessage: 'Cartão recusado',
    }
  })
  context: {
    @IsString()
    @IsNotEmpty()
    serviceName: string;

    @IsString()
    @IsNotEmpty()
    professionalName: string;

    @IsString()
    @IsNotEmpty()
    clientName: string;

    @IsDate()
    @IsNotEmpty()
    date: Date;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsNumber()
    @IsNotEmpty()
    appointmentId: number;

    @IsNumber()
    @IsOptional()
    paymentId?: number;

    @IsString()
    @IsNotEmpty()
    errorMessage: string;
  };
}
