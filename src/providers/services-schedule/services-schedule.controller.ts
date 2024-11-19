import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { ServicesScheduleService } from './services-schedule.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServicesScheduleDto } from './dto/services-schedule.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { AdminSuccessResponse } from '../adm/admin.swagger';

@ApiTags('Services Schedule')
@Controller('services-schedule')
export class ServicesScheduleController {
  constructor(private readonly servicesScheduleService: ServicesScheduleService) {}

  @Version('1')
  @Post("/create")
  @ApiOperation({ summary: 'create a service schedule' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: ServicesScheduleDto })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  @ApiResponse(AdminSuccessResponse)
  create(@Body() createServicesScheduleDto: ServicesScheduleDto) {
    return this.servicesScheduleService.create(createServicesScheduleDto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'find all service schedules' })
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findAll() {
    return this.servicesScheduleService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'find one service schedule' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findOne(@Param('id') id: string) {
    return this.servicesScheduleService.findOne(+id);
  }

  @Version('1')
  @Get('professional/:id')
  @ApiOperation({ summary: 'find services by professional id' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findByProfessionalId(@Param('id') id: string) {
    return this.servicesScheduleService.findByProfessionalId(+id);
  }

  @Version('1')
  @Patch(':id')
  @ApiOperation({ summary: 'update a service schedule' })
  @ApiBody({description: 'Objeto JSON contendo dados', type: ServicesScheduleDto })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  update(@Param('id') id: string, @Body() updateServicesScheduleDto: ServicesScheduleDto) {
    return this.servicesScheduleService.update(+id, updateServicesScheduleDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({ summary: 'remove a service schedule' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  remove(@Param('id') id: string) {
    return this.servicesScheduleService.remove(+id);
  }
}