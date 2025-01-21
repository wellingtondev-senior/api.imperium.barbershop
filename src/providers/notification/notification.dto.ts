import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class SubscriptionDto {
  @IsNumber()
  userId: number;

  @IsString()
  fcmToken: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

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

  @IsNumber()
  @IsOptional()
  scheduleId?: number;
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
}
