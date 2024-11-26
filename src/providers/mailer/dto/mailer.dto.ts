import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsNotEmpty, IsDate, IsOptional, IsEmail, IsNumber, IsObject } from 'class-validator';

export class MailerDto { }

export class MailerTesteEmailDto {
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Este é um teste de envio de e-mail.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: {
      name: 'Test User',
      email: 'test@example.com',
      hash: 'test-hash'
    }
  })
  @IsObject()
  @IsNotEmpty()
  context: {
    name: string;
    email: string;
    hash: string;
  };
}

export class MailerConfirmationRegisterEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty()
  context: {
    name: string;
    email: string;
    hash: string;

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

  @ApiProperty({ example: 'payment-confirmation' })
  @IsString()
  @IsNotEmpty()
  template: string;
}

export class PaymentContextDto {
  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: new Date() })
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'Corte de Cabelo' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  professionalName: string;

  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ example: 123 })
  @IsNumber()
  @IsNotEmpty()
  scheduleId: number;

  @ApiProperty({ example: 456 })
  @IsNumber()
  @IsOptional()
  paymentId?: number;

  @ApiProperty({ example: 'Cartão recusado' })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}

export class PaymentSuccessEmailDto extends PaymentEmailBaseDto {
  @ApiProperty({
    example: {
      serviceName: 'Corte de Cabelo',
      professionalName: 'João Silva',
      clientName: 'Maria Santos',
      date: new Date(),
      amount: 100.00,
      scheduleId: 123,
      paymentId: 456,
    }
  })
  context: PaymentContextDto;
}

export class PaymentFailedEmailDto extends PaymentEmailBaseDto {
  @ApiProperty({
    example: {
      serviceName: 'Corte de Cabelo',
      professionalName: 'João Silva',
      clientName: 'Maria Santos',
      date: new Date(),
      amount: 100.00,
      appointmentId: 123,
      paymentId: 456,
      errorMessage: 'Cartão recusado',
    }
  })
  context: PaymentContextDto;
}
