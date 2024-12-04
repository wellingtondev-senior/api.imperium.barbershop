import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStripeResponseDto } from './payment.dto';
import { ServiceDto } from 'src/providers/service/dto/service.dto';
import { ClientInfoDto } from 'src/providers/client/dto/create-client.dto';

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
    description: 'Serviços solicitados',
    example: [{
      "id": 1,
      "name": "Corte de Cabelo",
      "price": 50
    }]
  })
  @IsArray()
  @IsObject({ each: true })
  services: ServiceDto[];

  @ApiProperty({
    description: 'Data e hora do agendamento',
    example: '2024-01-20T10:00:00Z'
  })
  @IsDateString()
  dateTime: string;

  @ApiProperty({
    description: 'Informações do cliente'
  })
  @ValidateNested()
  @Type(() => ClientInfoDto)
  clientInfo: ClientInfoDto;

  @ApiProperty({
    description: 'Informações do pagamento'
  })
  @ValidateNested()
  @Type(() => PaymentStripeResponseDto)
  payment: PaymentStripeResponseDto;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Status do agendamento',
    example: 'confirmed',
  })
  status: string
}
