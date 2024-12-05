import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDto } from 'src/providers/service/dto/service.dto';
import { ClientScheduleDto } from 'src/providers/client/dto/client.dto';



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
    description: 'ID do agendamento (opcional)',
    example: 1,
    required: false
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
  payment: Record<string, any>;
}

export class UpdateScheduleDto {
  @ApiProperty({
    description: 'Status do agendamento',
    example: 'confirmed'
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
