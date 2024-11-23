import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { AdmService } from './adm.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdmDto } from './dto/adm.dto';
import { Role } from 'src/enums/role.enum';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleGuard } from 'src/guards/role.guard';
import { AdminSuccessResponse } from './admin.swagger';

@ApiTags('Administradores')
@Controller('adm')
export class AdmController {
  constructor(private readonly admService: AdmService) {}

  @Version('1')
  @Post('create')
  @ApiOperation({ summary: 'Cria um administrador para a aplicação' })
  @ApiBody({ description: 'Objeto JSON contendo dados', type: AdmDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  @ApiResponse(AdminSuccessResponse)
  create(@Body() admDto: AdmDto) {
    return this.admService.create(admDto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Lista todos os administradores' })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findAll() {
    return this.admService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Busca um administrador pelo ID' })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findOne(@Param('id') id: string) {
    return this.admService.findOne(+id);
  }

  @Version('1')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um administrador' })
  @ApiBody({ description: 'Objeto JSON contendo dados', type: AdmDto })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  update(@Param('id') id: string, @Body() admDto: AdmDto) {
    return this.admService.update(+id, admDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um administrador' })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  remove(@Param('id') id: string) {
    return this.admService.remove(+id);
  }
}
