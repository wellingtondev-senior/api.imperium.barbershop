import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsNotEmpty, Min, IsEmail } from 'class-validator';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  VISA_CARD = 'visa_card',
  VISA_DEBIT = 'visa_debit',
  MASTERCARD = 'mastercard',
  MASTERCARD_DEBIT = 'mastercard_debit',
  MASTERCARD_PREPAID = 'mastercard_prepaid',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay'
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Valor total do pagamento',
    example: 100.00
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.VISA_CARD
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Nome no cartão',
    example: 'JOAO SILVA'
  })
  @IsString()
  @IsNotEmpty()
  cardName: string;

  @ApiProperty({
    description: 'Número do cartão',
    example: '4242424242424242'
  })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({
    description: 'Data de expiração do cartão',
    example: '12/25'
  })
  @IsString()
  @IsNotEmpty()
  cardExpiry: string;

  @ApiProperty({
    description: 'CVV do cartão',
    example: '123'
  })
  @IsString()
  @IsNotEmpty()
  cardCvv: string;


}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID do pagamento'
  })
  id: number;

  @ApiProperty({
    description: 'Valor total'
  })
  amount: number;

  @ApiProperty({
    description: 'Status do pagamento',
    enum: PaymentStatus
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'ID do pagamento no Stripe'
  })
  stripePaymentId?: string;

  @ApiProperty({
    description: 'Mensagem de erro, se houver'
  })
  error?: string;

  @ApiProperty({
    description: 'Data de criação'
  })
  create_at: Date;

  @ApiProperty({
    description: 'Data de atualização'
  })
  update_at: Date;
}
