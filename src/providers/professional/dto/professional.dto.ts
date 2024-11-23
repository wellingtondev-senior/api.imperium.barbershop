import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsBoolean, IsUrl, Min, Max } from "class-validator"

export interface WorkingHours {
  
  monday?: { start: string; end: string };
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export class ProfessionalDto {
  @ApiProperty({ required: false, description: 'ID único do profissional' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'ID do usuário associado ao profissional' })
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Nome completo do profissional' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email do profissional' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefone do profissional' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Senha de acesso' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ required: false, description: 'URL da foto de perfil' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ required: false, description: 'CPF do profissional' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ required: false, description: 'Anos de experiência' })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({ required: false, description: 'Lista de especialidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiProperty({ required: false, description: 'Avaliação média (0-5)', minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ required: false, description: 'Horários de trabalho' })
  @IsOptional()
  workingHours?: WorkingHours;

  @ApiProperty({ required: false, description: 'Localização ou endereço' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Biografia do profissional' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, description: 'Indica se está disponível para atendimentos' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false, description: 'Redes sociais' })
  @IsOptional()
  socialMedia?: SocialMedia;

  @ApiProperty({ description: 'Professional identification document number (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  document: string;

  @ApiProperty({ description: 'Type of identification document (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  type_doc: string;

  @ApiProperty({ required: false, description: 'URL of the professional profile picture' })
  @IsOptional()
  @IsString()
  avatar?: string;
}