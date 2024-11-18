import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';

export class CreateSessionHashDto {
 

  @ApiProperty({
    description: 'Unique hash string',
    example: 'abcd1234',
  })
  @IsString()
  @IsNotEmpty()
  hash: string;

  @ApiProperty({
    description: 'Code associated with the session',
    example: 123456,
  })
  @IsInt()
  codigo: number;

  @ApiProperty({
    description: 'Status of the session',
    example: true,
  })
  @IsBoolean()
  status: boolean;

  @ApiProperty({
    description: 'Action associated with the session',
    example: 'login',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'Expiration date of the session',
    example: '2024-10-12T03:00:00.000Z',
  })
  @IsDate()
  validate: Date;




  @ApiProperty({
    description: 'User ID associated with the session',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  userId: number;
}
