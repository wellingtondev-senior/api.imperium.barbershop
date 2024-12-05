import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';


export class ClientScheduleDto {
  @ApiProperty({
    description: 'Nome no cartão',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  cardName: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'john@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Código do país do telefone',
    example: '+55'
  })
  @IsString()
  @IsNotEmpty()
  phoneCountry: string;
}