import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class ProfessionalDto {
  @ApiProperty({ description: 'Professional full name' })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({ description: 'Professional email address for contact' })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string

  @ApiProperty({ required: false, description: 'URL of the professional profile picture' })
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiProperty({ description: 'Professional identification document number (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  document: string

  @ApiProperty({ description: 'Type of identification document (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  type_doc: string

  @ApiProperty({ example: '*********',required: true })
  @IsString()
  password: string;

  @ApiProperty({ example: 0, required: true})
  @IsInt()
  userId?: number;
  
}