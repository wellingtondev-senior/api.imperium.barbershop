import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  professionalId: number;

  @IsNumber()
  clientId: number;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  professionalId?: number;

  @IsNumber()
  @IsOptional()
  clientId?: number;
}
