import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { AdminSuccessResponse } from '../adm/admin.swagger';

@ApiTags('Schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Version('1')
  @Post()
  @ApiOperation({ summary: 'Create a new schedule with payment' })
  @ApiBody({ description: 'Schedule data with payment information', type: CreateScheduleDto })
  @HttpCode(201)
  @ApiResponse(AdminSuccessResponse)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Find all schedules' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findAll() {
    return this.scheduleService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Find one schedule' })
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(+id);
  }

  @Version('1')
  @Get('professional/:id')
  @ApiOperation({ summary: 'Find schedules by professional id' })
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  findByProfessionalId(@Param('id') id: string) {
    return this.scheduleService.findByProfessionalId(+id);
  }

  @Version('1')
  @Patch(':id')
  @ApiOperation({ summary: 'Update schedule status' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(+id, updateScheduleDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a schedule' })
  @Roles(Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(200)
  @ApiResponse(AdminSuccessResponse)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(+id);
  }
}