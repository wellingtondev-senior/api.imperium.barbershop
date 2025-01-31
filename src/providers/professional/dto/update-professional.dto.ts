import { ApiProperty } from "@nestjs/swagger"
import { 
  IsEmail, 
  IsInt, 
  IsOptional, 
  IsNumber, 
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
import { WorkingHoursDto, SocialMediaDto, ProfessionalStatus } from './professional.dto';

export class UpdateProfessionalDto {
  // Identificação
  @ApiProperty({ required: false, description: 'ID único do profissional' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ required: false, description: 'ID do usuário associado ao profissional' })
  @IsOptional()
  @IsInt({ message: 'userId deve ser um número inteiro' })
  userId?: number;

  @ApiProperty({ required: false, description: 'Nome completo do profissional' })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  name?: string;

  @ApiProperty({ required: false, description: 'Email do profissional' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({ required: false, description: 'Telefone do profissional' })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Documento de identificação (CPF, CNPJ, etc)' })
  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string' })
  document?: string;

  @ApiProperty({ required: false, description: 'Tipo do documento (CPF, CNPJ, etc)' })
  @IsOptional()
  @IsString({ message: 'Tipo do documento deve ser uma string' })
  type_doc?: string;

  // Autenticação
  @ApiProperty({ required: false, description: 'Senha de acesso' })
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  password?: string;

  @ApiProperty({ required: false, description: 'Status de ativação da conta' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // Informações profissionais
  @ApiProperty({ required: false, description: 'Lista de especialidades' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

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
  @ApiProperty({ required: false, description: 'Status do profissional', enum: ProfessionalStatus })
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
