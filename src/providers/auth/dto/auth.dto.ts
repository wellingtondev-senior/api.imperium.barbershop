import { IsString, IsEmail, IsHash, IsDateString, isString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
	@ApiProperty({ required: true , example: 'email@email.com', description: 'Email do usuário'})
	@IsString()
	email: string;
  
	@ApiProperty({ required: true , example: 'password123', description: 'Senha do usuário' })
	@IsString()
	password: string;
}
export class AuthForgotDto {
	@ApiProperty({ required: true , example: 'password123', description: 'Senha do usuário' })
	@IsString()
	password: string;

	@ApiProperty({ example: 1 })
	@IsNumber()
	userId: number;
}
