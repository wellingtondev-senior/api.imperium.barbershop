import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, Min, MaxLength, IsEmail, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { CardDTO } from '../../../modulos/stripe/dto/stripe-payment.dto';

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
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Valor do agendamento',
    example: 100.00
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({
    description: 'Valor total do agendamento',
    example: 100.00
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    example: 'card',
    enum: ['card']
  })
  @IsString()
  @IsEnum(['card'])
  method: 'card';

  @ApiProperty({
    description: 'ID do profissional',
    example: 1
  })
  @IsInt()
  professionalId: number;

  @ApiProperty({
    description: 'IDs dos serviços',
    example: [1]
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
  observation?: string;

  @ApiProperty({
    description: 'Informações do cliente'
  })
  @ValidateNested()
  @Type(() => ClientInfoDto)
  clientInfo: ClientInfoDto;

  @ApiProperty({
    description: 'Informações do cartão de pagamento'
  })
  @ValidateNested()
  @Type(() => CardDTO)
  payment: CardDTO;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Status do agendamento',
    enum: ScheduleStatus
  })
  @IsEnum(ScheduleStatus)
  status: ScheduleStatus;
}

export class ScheduleResponseDto {
  @ApiProperty({
    description: 'ID do agendamento'
  })
  id: number;

  @ApiProperty({
    description: 'Data e hora do agendamento'
  })
  date: Date;

  @ApiProperty({
    description: 'Status do agendamento',
    enum: ScheduleStatus
  })
  status: ScheduleStatus;

  @ApiProperty({
    description: 'Observações do agendamento'
  })
  notes?: string;

  @ApiProperty({
    description: 'ID do profissional'
  })
  professionalId: number;

  @ApiProperty({
    description: 'ID do cliente'
  })
  clientId: number;

  @ApiProperty({
    description: 'ID do serviço'
  })
  serviceId: number;

  @ApiProperty({
    description: 'ID do pagamento'
  })
  paymentId?: number;

  @ApiProperty({
    description: 'Data de criação'
  })
  create_at: Date;

  @ApiProperty({
    description: 'Data de atualização'
  })
  update_at: Date;
}