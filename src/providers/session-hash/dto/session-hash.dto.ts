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
  @IsNotEmpty()
  codigo: number;

  @ApiProperty({
    description: 'Status of the session',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;

  @ApiProperty({
    description: 'Action associated with the session',
    example: 'confirm-register',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'Expiration date of the session',
    example: '2024-10-12T03:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
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

export class ValidateHashDto {
  @ApiProperty({
    description: 'Hash string to validate',
    example: 'abcd1234',
  })
  @IsString()
  @IsNotEmpty()
  hash: string;

  @ApiProperty({
    description: 'User ID associated with the hash',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class HashResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message or data',
    example: {
      hash: 'abcd1234',
      valid: true,
      renewed: false,
      validate: '2024-10-12T03:00:00.000Z',
    },
  })
  message: {
    hash: string;
    valid: boolean;
    renewed?: boolean;
    validate?: Date;
    codigo?: number;
    action?: string;
  };
}
