import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator'

export class ServicesScheduleDto {


  @ApiProperty({
    description: 'The name of the service',
    example: 'Haircut'
  })
  @IsString()
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: 'The description of the service',
    example: 'Professional haircut service',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @ApiProperty({
    description: 'The price of the service',
    example: 50.00
  })
  @IsNumber()
  @Min(0)
  price: number

  @ApiProperty({
    description: 'The duration of the service in minutes',
    example: 60
  })
  @IsNumber()
  @Min(1)
  duration: number

  @ApiProperty({
    description: 'The ID of the professional providing the service',
    example: 1
  })
  @IsNumber()
  @Min(1)
  profissionalId: number
}