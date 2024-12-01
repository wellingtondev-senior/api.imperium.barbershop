import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class ServiceDto {
  @ApiProperty({ description: 'Nome do serviço' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição do serviço', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Duração do serviço em minutos' })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Preço do serviço' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Status do serviço', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ description: 'ID do profissional responsável' })
  @IsNumber()
  professionalId: number;
}
