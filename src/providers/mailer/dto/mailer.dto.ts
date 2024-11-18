export class MailerDto { }
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsBoolean, IsNotEmpty, IsDate, IsOptional, IsEmail } from 'class-validator';
import { AdmDto } from 'src/providers/adm/dto/create-adm.dto';

export class MailerTesteEmailDto {

  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string; // Endereço de e-mail do destinatário

  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  subject: string; // Assunto do e-mail

  @ApiProperty({ example: 'Este é um teste de envio de e-mail.' })
  @IsString()
  @IsNotEmpty()
  message: string; // Corpo da mensagem do e-mail
}
export class MailerConfirmationRegisterEmailDto {
  
  @ApiProperty({ example: 'example@example.com' })
  @IsEmail()
  @IsNotEmpty()
  destino: string;// Endereço de e-mail do destinatário


  @ApiProperty({ example: 'Teste de E-mail' })
  @IsString()
  @IsNotEmpty()
  assunto: string; // Assunto do e-mail


  @ApiProperty({ example: '000000' })
  @IsInt()
  @IsNotEmpty()
  codigo: number;


  @ApiProperty({ example: '3g5Hk6l389cFw34S' })
  @IsString()
  @IsNotEmpty()
  hash: string;


  @ApiProperty({ example: 'Este é um teste de envio de e-mail.' })
  @IsString()
  @IsNotEmpty()
  name: string;
  // Corpo da mensagem do e-mail
}
