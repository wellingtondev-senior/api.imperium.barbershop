import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CardDTO {
  @ApiProperty({ example: '4242424242424242' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsNotEmpty()
  exp_month: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  exp_year: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  cvc: string;
}

export class StripePaymentDTO {
  @ApiProperty()
  @IsNotEmpty()
  card: CardDTO;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Pagamento do serviço' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
