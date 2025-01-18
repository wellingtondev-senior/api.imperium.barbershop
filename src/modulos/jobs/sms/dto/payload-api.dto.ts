import { IsString, IsNotEmpty, IsMobilePhone } from 'class-validator';

export class ReceivePayloadApiDto{

  @IsNotEmpty()
  @IsMobilePhone()
  to: string;

  @IsNotEmpty()
  @IsString()
  message: string;

}
