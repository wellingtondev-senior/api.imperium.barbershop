import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { ProfessionalDto } from './dto/professional.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { ProfessionalListSuccessResponse, ProfessionalSuccessResponse } from './professional.swagger';



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
  @ApiResponse(ProfessionalListSuccessResponse)
  findAll() {
    return this.professionalService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'find one professional' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(ProfessionalSuccessResponse)
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
  @ApiResponse(ProfessionalSuccessResponse)
  update(@Param('id') id: number, @Body() professionalDto: ProfessionalDto) {
    return this.professionalService.update(+id, professionalDto);
  }

  @Version('1')
  @Delete(':profissionalId/:userId')
  @ApiOperation({ summary: 'remove a professional' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(ProfessionalSuccessResponse)
  remove(
    @Param('profissionalId') profissionalId: number,
    @Param('userId') userId: number,
  ) {
    return this.professionalService.remove(profissionalId, userId);
  }

  @Version('1')
  @Get('email/:email')
  @ApiOperation({ summary: 'find professional by email' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(ProfessionalSuccessResponse)
  findByEmail(@Param('email') email: string) {
    return this.professionalService.findByEmail(email);
  }
}