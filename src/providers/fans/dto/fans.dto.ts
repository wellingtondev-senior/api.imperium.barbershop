import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Role } from 'src/enums/role.enum';

export class CreateFansDto {
  @ApiProperty({ example: 'Empresa XYZ' })
  @IsString()
  name: string;

  @ApiProperty({ example: '00000000000' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: 'email@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '*********' })
  @IsString()
  password: string;

  

}

export class ConfirmEmailFansDto {


  @ApiProperty({ example: '000000' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 'fd4Rgh50gbvhgAswEc789' })
  @IsString()
  hash: string;




}
export class UpdateFansDto {
  @ApiProperty({ example: 'Empresa XYZ', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '00000000000', required: false })
  @IsOptional()
  @IsString()
  cpf?: string;
}
