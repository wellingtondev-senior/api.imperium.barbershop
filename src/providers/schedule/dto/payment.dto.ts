import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsNotEmpty, Min, IsEmail, IsBoolean, IsArray, IsOptional } from 'class-validator';



export class PaymentStripeResponseDto {
  @ApiProperty({ description: 'ID do pagamento no Stripe' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Método de pagamento' })
  @IsString()
  method: string;

  @ApiProperty({ description: 'Status do pagamento' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Valor em centavos' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Moeda' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tipo do objeto' })
  @IsString()
  object: string;

  @ApiProperty({ description: 'Detalhes do valor' })
  amount_details: {
    tip: Record<string, unknown>;
  };

  @ApiProperty({ description: 'Método de captura' })
  @IsString()
  capture_method: string;

  @ApiProperty({ description: 'Client secret do pagamento' })
  @IsString()
  client_secret: string;

  @ApiProperty({ description: 'Método de confirmação' })
  @IsString()
  confirmation_method: string;

  @ApiProperty({ description: 'Data de criação' })
  @IsNumber()
  created: number;

  @ApiProperty({ description: 'Ambiente (teste ou produção)' })
  @IsBoolean()
  livemode: boolean;

  @ApiProperty({ description: 'ID do método de pagamento' })
  @IsString()
  payment_method: string;

  @ApiProperty({ description: 'Tipos de métodos de pagamento aceitos' })
  @IsArray()
  payment_method_types: string[];

  @ApiProperty({ description: 'Métodos de pagamento automáticos' })
  @IsOptional()
  automatic_payment_methods: null;

  @ApiProperty({ description: 'Data de cancelamento' })
  @IsOptional()
  canceled_at: null;

  @ApiProperty({ description: 'Razão do cancelamento' })
  @IsOptional()
  cancellation_reason: null;

  @ApiProperty({ description: 'Último erro de pagamento' })
  @IsOptional()
  last_payment_error: null;

  @ApiProperty({ description: 'Próxima ação' })
  @IsOptional()
  next_action: null;

  @ApiProperty({ description: 'Configurações do método de pagamento' })
  @IsOptional()
  payment_method_configuration_details: null;

  @ApiProperty({ description: 'Status do processamento' })
  @IsOptional()
  processing: null;

  @ApiProperty({ description: 'Email do recibo' })
  @IsOptional()
  receipt_email: null;

  @ApiProperty({ description: 'Configuração de uso futuro' })
  @IsOptional()
  setup_future_usage: null;

  @ApiProperty({ description: 'Informações de envio' })
  @IsOptional()
  shipping: null;

  @ApiProperty({ description: 'Fonte do pagamento' })
  @IsOptional()
  source: null;
}
