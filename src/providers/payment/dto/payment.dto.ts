import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsObject, IsDateString } from 'class-validator';

export class CardDTO {
  @ApiProperty({ example: '4242424242424242' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsNotEmpty()
  exp_month: string;

  @ApiProperty({ example: '2025' })
  @IsString()
  @IsNotEmpty()
  exp_year: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  cvc: string;
}

export class CreatePaymentDTO {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  appointmentId: number;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  card: CardDTO;
}

export class StripeWebhookDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  object: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  data: {
    object: {
      id: string;
      object: string;
      amount: number;
      status: string;
      metadata: {
        appointmentId: string;
      };
    };
  };
}
