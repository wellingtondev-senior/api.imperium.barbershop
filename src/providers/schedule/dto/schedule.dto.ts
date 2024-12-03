import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePaymentDto } from '../../../providers/schedule/dto/payment.dto';

export enum ScheduleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export class ClientInfoDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@email.com'
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '11999999999'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Código do país do telefone',
    example: '+55'
  })
  @IsString()
  @IsNotEmpty()
  phoneCountry: string;
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID do profissional',
    example: 1
  })
  @IsInt()
  professionalId: number;

  @ApiProperty({
    description: 'IDs dos serviços',
    example: [1, 2]
  })
  @IsArray()
  @IsInt({ each: true })
  servicesId: number[];

  @ApiProperty({
    description: 'Data e hora do agendamento',
    example: '2024-01-20T10:00:00Z'
  })
  @IsDateString()
  dateTime: string;

  @ApiProperty({
    description: 'Observação do agendamento',
    example: 'Observação do agendamento',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

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
  @Type(() => CreatePaymentDto)
  payment: CreatePaymentDto;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Status do agendamento',
    enum: ScheduleStatus
  })
  @IsEnum(ScheduleStatus)
  status: ScheduleStatus;
}

