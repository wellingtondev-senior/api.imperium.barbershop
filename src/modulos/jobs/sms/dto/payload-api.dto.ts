import { IsString, IsNotEmpty, IsMobilePhone, IsArray } from 'class-validator';

export class ReceivePayloadApiDto{

  @IsNotEmpty()
  @IsMobilePhone()
  to: string;

  @IsNotEmpty()
  @IsString()
  client: string;

  @IsNotEmpty()
  @IsArray()
  service: Array<{
    name: string;
    price: number;
  }>;

  @IsNotEmpty()
  @IsString()
  link: string;
}
