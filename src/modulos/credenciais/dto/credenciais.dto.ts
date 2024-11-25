import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Role } from '../../../enums/role.enum';

export class CredenciaisDto {
  @ApiProperty({ example: 1, description: 'The ID of the user' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'CLIENT', description: 'The role of the user', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 0, description: 'The associated users' })
  @IsOptional()
  @IsInt()
  user: number;
}
