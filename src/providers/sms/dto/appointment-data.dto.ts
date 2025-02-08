import { IsString, IsArray, IsDateString, IsOptional } from 'class-validator';

interface ServiceData {
  name: string;
  price: number;
}

export class AppointmentDataDto {
  @IsString()
  to: string;

  @IsString()
  client: string;

  @IsArray()
  service: ServiceData[];

  @IsDateString()
  appointmentDate: Date;

  @IsString()
  barberName: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  additionalMessage?: string;
}
