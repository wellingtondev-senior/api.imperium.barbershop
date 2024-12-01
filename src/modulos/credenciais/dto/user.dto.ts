import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsOptional, IsEnum, MinLength } from 'class-validator';
import { Role } from '../../../enums/role.enum';

export class UserDto {
  @ApiProperty({ example: 1, description: 'The ID of the user' })
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CLIENT', description: 'The role of the user', enum: Role })
  @IsEnum(Role)
  role: string;

  @ApiProperty({ example: false, description: 'Whether the user account is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean = false;

  @ApiProperty({ example: new Date(), description: 'The creation date of the user' })
  @IsOptional()
  create_at?: Date;

  @ApiProperty({ example: new Date(), description: 'The last update date of the user' })
  @IsOptional()
  update_at?: Date;

  @ApiProperty({ type: [Object], description: 'Professional relationships' })
  @IsOptional()
  professional?: any[];

  @ApiProperty({ type: [Object], description: 'User credentials' })
  @IsOptional()
  credenciais?: any[];

  @ApiProperty({ type: [Object], description: 'Admin relationships' })
  @IsOptional()
  adm?: any[];
}