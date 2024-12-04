import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';


export class ClientInfoDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@email.com'
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '11999999999'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Código do país do telefone',
    example: '+55'
  })
  @IsString()
  @IsNotEmpty()
  phoneCountry: string;
}