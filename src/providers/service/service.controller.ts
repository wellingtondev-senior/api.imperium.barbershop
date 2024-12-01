import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceDto } from './dto/service.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../guards/role.guard';
import { Role } from '../../enums/role.enum';
import { Roles } from 'src/decorator/roles.decorator';

@ApiTags('Services')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Version('1')
  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  create(@Body() serviceDto: ServiceDto) {
    return this.serviceService.create(serviceDto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll() {
    return this.serviceService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Version('1')
  @Get('professional/:professionalId')
  @ApiOperation({ summary: 'Get services by professional ID' })
  findByProfessional(@Param('professionalId') professionalId: string) {
    return this.serviceService.findByProfessional(+professionalId);
  }

  @Version('1')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  update(@Param('id') id: string, @Body() serviceDto: ServiceDto) {
    return this.serviceService.update(+id, serviceDto);
  }

  @Version('1')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}
