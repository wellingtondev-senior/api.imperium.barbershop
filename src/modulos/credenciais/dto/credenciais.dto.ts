import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, IsInt } from 'class-validator';
import { UserDto } from './user.dto';

export class CredenciaisDto {
  @ApiProperty({ example: 1, description: 'The ID of the credentials' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'john@example.com', description: 'The email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 1, description: 'The ID of the associated user' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: new Date(), description: 'The creation date' })
  @IsOptional()
  create_at?: Date;

  @ApiProperty({ example: new Date(), description: 'The last update date' })
  @IsOptional()
  update_at?: Date;

  @ApiProperty({ type: () => UserDto, description: 'The associated user' })
  @IsOptional()
  user?: UserDto;
}
