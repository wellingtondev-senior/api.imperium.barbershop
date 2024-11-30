import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { ProfessionalDto } from './dto/professional.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { AdminSuccessResponse } from '../adm/admin.swagger';
import { ProfessionalSuccessResponse } from './professional.swagger';



@ApiTags('Professional')
@Controller('professional')
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  
  @Version('1')
  @Post("create")
  @ApiOperation({ summary: 'create a professional' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: ProfessionalDto })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  @ApiResponse(ProfessionalSuccessResponse) 
  create(@Body() admDto : ProfessionalDto ) {
    return this.professionalService.create(admDto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'find all professionals' })
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findAll() {
    return this.professionalService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'find one professional' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findOne(@Param('id') id: string) {
    return this.professionalService.findOne(+id);
  }

  @Version('1')
  @Patch(':id')
  @ApiOperation({ summary: 'update a professional' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: ProfessionalDto })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  update(@Param('id') id: string, @Body() professionalDto: ProfessionalDto) {
    return this.professionalService.update(+id, professionalDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({ summary: 'remove a professional' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  remove(@Param('id') id: string) {
    return this.professionalService.remove(+id);
  }

  @Version('1')
  @Get('email/:email')
  @ApiOperation({ summary: 'find professional by email' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findByEmail(@Param('email') email: string) {
    return this.professionalService.findByEmail(email);
  }
}