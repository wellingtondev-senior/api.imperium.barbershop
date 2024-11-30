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
  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  monday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  tuesday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  wednesday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  thursday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  friday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  saturday?: WorkingHourDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHourDto)
  sunday?: WorkingHourDto;
}

export class SocialMediaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
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

  @ApiProperty({ description: 'Documento de identificação (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  document: string;

  @ApiProperty({ description: 'Tipo do documento (CPF, CNPJ, etc)' })
  @IsNotEmpty()
  @IsString()
  type_doc: string;

  @ApiProperty({ required: false, description: 'CPF do profissional' })
  @IsOptional()
  @IsString()
  cpf?: string;

  // Autenticação
  @ApiProperty({ description: 'Senha de acesso' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ required: false, description: 'Papel do usuário no sistema' })
  @IsOptional()
  @IsString()
  role?: string;

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

  @ApiProperty({ required: false, description: 'Redes sociais' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  // Status
  @ApiProperty({ description: 'Status do profissional', enum: ProfessionalStatus })
  @IsEnum(ProfessionalStatus)
  status: ProfessionalStatus;

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