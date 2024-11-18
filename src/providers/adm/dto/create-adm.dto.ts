import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsEmail, IsNotEmpty, IsDate, IsEnum } from 'class-validator';
import { Role } from 'src/enums/role.enum';

export class AdmDto {
  @ApiProperty({ example: 'Empresa XYZ' ,required: true})
  @IsString()
  name: string;


  @ApiProperty({ example: 'email@email.com' ,required: true})
  @IsEmail()
  email: string;

  @ApiProperty({ example: '*********',required: true })
  @IsEmail()
  password: string;

  @ApiProperty({ example: 0, required: true})
  @IsInt()
  userId?: number;
  

//   @ApiProperty({ example: 'ADM', description: 'The role of the user' })
//   @IsEnum(["FANS", "LUTADOR", "ADM", "MASTER"])
//   role?: Role
}
