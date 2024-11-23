import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, Min, MaxLength, IsEnum, IsDate, IsArray } from 'class-validator'
import { Role } from '../../../enums/role.enum'

export enum ServiceStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export class ServicesScheduleDto {
  @ApiProperty({
    description: 'The name of the service',
    example: 'Haircut'
  })
  @IsString()
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: 'The description of the service',
    example: 'Professional haircut service',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @ApiProperty({
    description: 'The price of the service',
    example: 50.00
  })
  @IsNumber()
  @Min(0)
  price: number

  @ApiProperty({
    description: 'The duration of the service in minutes',
    example: 60
  })
  @IsNumber()
  @Min(1)
  duration: number

  @ApiProperty({
    description: 'The ID of the professional providing the service',
    example: 1
  })
  @IsNumber()
  @Min(1)
  profissionalId: number
}

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'The date and time of the appointment',
    example: '2024-01-20T10:00:00Z'
  })
  @IsDate()
  date: Date

  @ApiProperty({
    description: 'The status of the appointment',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING
  })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus

  @ApiProperty({
    description: 'The ID of the professional',
    example: 1
  })
  @IsNumber()
  @Min(1)
  professionalId: number

  @ApiProperty({
    description: 'The ID of the service',
    example: 1
  })
  @IsNumber()
  @Min(1)
  serviceId: number

  @ApiProperty({
    description: 'The ID of the fan/client',
    example: 1
  })
  @IsNumber()
  @Min(1)
  fanId: number
}

export class UpdateAppointmentDto extends CreateAppointmentDto {
  @ApiProperty({
    description: 'The ID of the payment',
    example: 1,
    required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  paymentId?: number
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The amount to be paid',
    example: 50.00
  })
  @IsNumber()
  @Min(0)
  amount: number

  @ApiProperty({
    description: 'The payment method',
    example: 'credit_card'
  })
  @IsString()
  method: string

  @ApiProperty({
    description: 'The ID of the service',
    example: 1
  })
  @IsNumber()
  @Min(1)
  serviceId: number
}