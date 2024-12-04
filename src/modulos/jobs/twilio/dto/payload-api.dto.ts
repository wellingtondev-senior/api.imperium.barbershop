import { IsString, IsNotEmpty, IsMobilePhone, IsObject } from 'class-validator';

export class ReceivePayloadApiDto{

  @IsNotEmpty()
  @IsMobilePhone()
  to: string;

  @IsNotEmpty()
  @IsString()
  client: string;

  @IsNotEmpty()
  @IsObject()
  service: object[];

  @IsNotEmpty()
  @IsString()
  link: string;
}
