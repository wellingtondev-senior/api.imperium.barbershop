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
  service: {
    name: string;
    price: number;
  };

  @IsNotEmpty()
  @IsString()
  link: string;
}
