import { IsString, IsNotEmpty, IsMobilePhone, IsArray, IsDate, IsUrl, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}

export class AppointmentDataDto {
  @IsString()
  @IsMobilePhone()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  client: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  service: ServiceItemDto[];

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  appointmentDate: Date;

  @IsString()
  @IsNotEmpty()
  barberName: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  additionalMessage?: string;

  @IsString()
  @IsOptional()
  status_schedule?: string;

  @IsString()
  @IsOptional()
  status_payment?: string;

  @IsOptional()
  is_confirmed?: boolean;
}