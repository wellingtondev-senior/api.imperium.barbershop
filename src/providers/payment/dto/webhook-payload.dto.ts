import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';



export class WebhookPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  object: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  api_version: string;

  @ApiProperty()
  @IsNumber()
  created: number;

  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;

  @ApiProperty()
  @IsBoolean()
  livemode: boolean;

  @ApiProperty()
  @IsNumber()
  pending_webhooks: number;

  @ApiProperty()
  @IsObject()
  request: {
    id: string;
    idempotency_key: string;
    [key: string]: any;
  };
}