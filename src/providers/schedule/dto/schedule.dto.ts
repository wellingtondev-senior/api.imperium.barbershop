import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDto } from 'src/providers/service/dto/service.dto';
import { ClientScheduleDto } from 'src/providers/client/dto/client.dto';

// Define payment interface for DTO validation
export interface PaymentData {
  id: string;
  object: string;
  amount: number;
  client_secret: string;
  created: number;
  currency: string;
  status: string;
  payment_method: string;
  livemode: boolean;
  type: string;
  api_version: string;
  pending_webhooks: number;
  request: any;
  data: any;
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID do agendamento (opcional)',
    example: 1,
    required: false
  })
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'ID do profissional',
    example: 1
  })
  @IsInt()
  @IsNotEmpty()
  professionalId: number

  @ApiProperty({
    description: 'Serviços solicitados',
    example: [{
      "id": 1,
      "name": "Corte de Cabelo",
      "price": 50
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ApiProperty({
    description: 'Data do agendamento',
    example: '2024-12-21T03:00:00.000Z'
  })
  @IsString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Hora do agendamento',
    example: '10:00'
  })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    description: 'Informações do cliente',
    example: {
      "cardName": "John Doe",
      "email": "john@example.com",
      "phoneCountry": "+55"
    }
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ClientScheduleDto)
  clientInfo: ClientScheduleDto;

  @ApiProperty({
    description: 'Informações do pagamento'
  })
  @IsNotEmpty()
  @IsObject()
  payment: PaymentData;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Status do agendamento',
    example: 'confirmed',
    enum: ['pending', 'confirmed', 'completed', 'canceled']
  })
  @IsString()
  @IsEnum(['pending', 'confirmed', 'completed', 'canceled'])
  @IsOptional()
  status_schedule?: string;

  @ApiProperty({
    description: 'Status do pagamento',
    example: 'succeeded',
    enum: ['pending', 'succeeded', 'canceled']
  })
  @IsString()
  @IsEnum(['pending', 'succeeded', 'canceled'])
  @IsOptional()
  status_payment?: string;

  @ApiProperty({
    description: 'Tipo de pagamento',
    example: 'credit_card'
  })
  @IsString()
  @IsOptional()
  type_payment?: string;

  @ApiProperty({
    description: 'Confirmação do agendamento',
    example: true
  })
  @IsOptional()
  is_confirmed?: boolean;
}
