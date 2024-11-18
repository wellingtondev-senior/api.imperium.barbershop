import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { AdmService } from './adm.service';
import { UpdateAdmDto } from './dto/update-adm.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdmDto } from './dto/create-adm.dto';
import { Role } from 'src/enums/role.enum';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { AdminSuccessResponse } from './admin.swagger';

@ApiTags('Administradores')
@Controller('adm')
export class AdmController {
  constructor(private readonly admService: AdmService) {}

  @Version('1')
  @Post("create")
  @ApiOperation({ summary: 'Cria um administrador para a aplicação' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: AdmDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  @ApiResponse(AdminSuccessResponse) 
  create(@Body() admDto : AdmDto ) {
    return this.admService.create(admDto);
  }

  @Version('1')
  @Get("all")
  @ApiOperation({ summary: 'Cria um administrador para a aplicação' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: AdmDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  @ApiResponse(AdminSuccessResponse) 
  cfindAll(@Body() admDto : AdmDto ) {
    return this.admService.findAll(admDto);
  }
}
