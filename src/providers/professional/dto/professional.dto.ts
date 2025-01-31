import { ApiProperty } from "@nestjs/swagger"
import { 
  IsEmail, 
  IsInt, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  IsArray, 
  IsBoolean, 
  IsUrl, 
  Min, 
  Max,
  IsEnum,
  ValidateNested,
  IsDateString
} from "class-validator"
import { Type } from 'class-transformer';

export class WorkingHourDto {
  @ApiProperty({ description: 'Horário de início' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'Horário de término' })
  @IsString()
  end: string;
}

export class WorkingHoursDto {
  @ApiProperty({ description: 'Horário de início segunda-feira' })
  @IsString()
  mondayStart: string;

  @ApiProperty({ description: 'Horário de término segunda-feira' })
  @IsString()
  mondayEnd: string;

  @ApiProperty({ description: 'Horário de início terça-feira' })
  @IsString()
  tuesdayStart: string;

  @ApiProperty({ description: 'Horário de término terça-feira' })
  @IsString()
  tuesdayEnd: string;

  @ApiProperty({ description: 'Horário de início quarta-feira' })
  @IsString()
  wednesdayStart: string;

  @ApiProperty({ description: 'Horário de término quarta-feira' })
  @IsString()
  wednesdayEnd: string;

  @ApiProperty({ description: 'Horário de início quinta-feira' })
  @IsString()
  thursdayStart: string;

  @ApiProperty({ description: 'Horário de término quinta-feira' })
  @IsString()
  thursdayEnd: string;

  @ApiProperty({ description: 'Horário de início sexta-feira' })
  @IsString()
  fridayStart: string;

  @ApiProperty({ description: 'Horário de término sexta-feira' })
  @IsString()
  fridayEnd: string;

  @ApiProperty({ description: 'Horário de início sábado' })
  @IsString()
  saturdayStart: string;

  @ApiProperty({ description: 'Horário de término sábado' })
  @IsString()
  saturdayEnd: string;

  @ApiProperty({ description: 'Horário de início domingo' })
  @IsString()
  sundayStart: string;

  @ApiProperty({ description: 'Horário de término domingo' })
  @IsString()
  sundayEnd: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  professionalId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  create_at?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  update_at?: string;
}

export class SocialMediaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedin?: string;
}

export enum ProfessionalStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export class ProfessionalDto {
  // Identificação
  @ApiProperty({ required: false, description: 'ID único do profissional' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ required: true, description: 'ID do usuário associado ao profissional' })
  @IsNotEmpty({ message: 'userId é obrigatório' })
  @IsInt({ message: 'userId deve ser um número inteiro' })
  userId: number;

  @ApiProperty({ required: true, description: 'Nome completo do profissional' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @ApiProperty({ required: true, description: 'Email do profissional' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ required: true, description: 'Telefone do profissional' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString({ message: 'Telefone deve ser uma string' })
  phone: string;

  @ApiProperty({ required: true, description: 'Documento de identificação (CPF, CNPJ, etc)' })
  @IsNotEmpty({ message: 'Documento é obrigatório' })
  @IsString({ message: 'Documento deve ser uma string' })
  document: string;

  @ApiProperty({ required: true, description: 'Tipo do documento (CPF, CNPJ, etc)' })
  @IsNotEmpty({ message: 'Tipo do documento é obrigatório' })
  @IsString({ message: 'Tipo do documento deve ser uma string' })
  type_doc: string;

  // Autenticação
  @ApiProperty({ required: true, description: 'Senha de acesso' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;

  @ApiProperty({ required: false, description: 'Status de ativação da conta' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // Informações profissionais
  @ApiProperty({ description: 'Lista de especialidades' })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @ApiProperty({ required: false, description: 'Anos de experiência' })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({ required: false, description: 'Avaliação média (0-5)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ required: false, description: 'Biografia do profissional' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false, description: 'Indica se está disponível para atendimentos' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  // Localização e horários
  @ApiProperty({ required: false, description: 'Horários de trabalho' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @ApiProperty({ required: false, description: 'Localização ou endereço' })
  @IsOptional()
  @IsString()
  location?: string;

  // Mídia
  @ApiProperty({ required: false, description: 'URL da foto de perfil' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiProperty({ required: false, description: 'URL da imagem do profissional' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  // Redes Sociais
  @ApiProperty({ required: false, description: 'Redes sociais do profissional' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  // Status
  @ApiProperty({ description: 'Status do profissional', enum: ProfessionalStatus })
  @IsOptional()
  @IsEnum(ProfessionalStatus)
  status?: ProfessionalStatus;

  @ApiProperty({ required: false, description: 'Disponibilidade do profissional' })
  @IsOptional()
  @IsString()
  availability?: string;

  // Metadados
  @ApiProperty({ required: false, description: 'Data de criação' })
  @IsOptional()
  @IsDateString()
  create_at?: string;

  @ApiProperty({ required: false, description: 'Data de atualização' })
  @IsOptional()
  @IsDateString()
  update_at?: string;
}
