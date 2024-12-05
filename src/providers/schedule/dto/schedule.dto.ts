import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, ValidateNested, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsEmail, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDto } from 'src/providers/service/dto/service.dto';

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
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ApiProperty({
    description: 'Data do agendamento',
    example: '2024-01-20'
  })
  @IsString()
  @IsNotEmpty()
  date: string;

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

export class ClientScheduleDto {
  @ApiProperty({
    description: 'Nome no cartão',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  cardName: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'john@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Código do país do telefone',
    example: '+55'
  })
  @IsString()
  @IsNotEmpty()
  phoneCountry: string;
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
