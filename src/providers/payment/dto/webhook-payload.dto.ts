import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CardDetailsDto {
  @ApiProperty()
  @IsString()
  brand: string;

  @ApiProperty()
  @IsNumber()
  exp_month: number;

  @ApiProperty()
  @IsNumber()
  exp_year: number;

  @ApiProperty()
  @IsString()
  last4: string;
}

export class BillingDetailsDto {
  @ApiProperty()
  @IsOptional()
  @IsObject()
  address?: {
    city: string | null;
    country: string | null;
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    state: string | null;
  };

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  phone: string;
}

export class PaymentMethodDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  object: string;

  @ApiProperty()
  @IsObject()
  billing_details: BillingDetailsDto;

  @ApiProperty()
  @IsObject()
  card: CardDetailsDto;

  @ApiProperty()
  @IsNumber()
  created: number;

  @ApiProperty()
  @IsBoolean()
  livemode: boolean;

  @ApiProperty()
  @IsString()
  type: string;
}

export class LastPaymentErrorDto {
  @ApiProperty()
  @IsString()
  charge: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  decline_code: string;

  @ApiProperty()
  @IsString()
  doc_url: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsObject()
  payment_method: PaymentMethodDto;

  @ApiProperty()
  @IsString()
  type: string;
}

export class PaymentIntentDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  object: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  amount_details?: {
    tip: any;
  };

  @ApiProperty()
  @IsString()
  capture_method: string;

  @ApiProperty()
  @IsString()
  client_secret: string;

  @ApiProperty()
  @IsString()
  confirmation_method: string;

  @ApiProperty()
  @IsNumber()
  created: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsBoolean()
  livemode: boolean;

  @ApiProperty()
  @IsOptional()
  last_payment_error?: LastPaymentErrorDto;

  @ApiProperty()
  @IsOptional()
  payment_method?: string | null;

  @ApiProperty()
  @IsArray()
  payment_method_types: string[];

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsOptional()
  canceled_at?: Date | null;

  @ApiProperty()
  @IsOptional()
  cancellation_reason?: string | null;

  @ApiProperty()
  @IsOptional()
  description?: string | null;

  @ApiProperty()
  @IsOptional()
  next_action?: any | null;

  @ApiProperty()
  @IsOptional()
  processing?: any | null;

  @ApiProperty()
  @IsOptional()
  receipt_email?: string | null;

  @ApiProperty()
  @IsOptional()
  setup_future_usage?: string | null;

  @ApiProperty()
  @IsOptional()
  shipping?: any | null;

  @ApiProperty()
  @IsOptional()
  source?: string | null;
}

export class WebhookPayloadDto {
  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  object: PaymentIntentDto;

  @ApiProperty()
  @IsOptional()
  previous_attributes?: any | null;
}