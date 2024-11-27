import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Role } from 'src/enums/role.enum';

export class AdmDto {
  @ApiProperty({ example: 'Empresa XYZ', required: true})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'email@email.com', required: true})
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '*********', required: true })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '123.456.789-00', required: false })
  @IsString()
  @IsOptional()
  cpf?: string;

  @ApiProperty({ example: Role.ADM, required: false })
  @IsOptional()
  role?: Role;

@ApiProperty({ example: 1, required: false })
@IsInt()
@IsOptional()
userId?: number;}
