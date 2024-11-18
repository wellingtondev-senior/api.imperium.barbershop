import { PartialType } from '@nestjs/swagger';
import { AdmDto } from './create-adm.dto';

export class UpdateAdmDto extends PartialType(AdmDto) {}
