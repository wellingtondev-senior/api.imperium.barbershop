import { Controller, Get, Post, Body, Patch, Param, Delete, Version, UseGuards, HttpCode } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { RoleGuard } from 'src/guards/role.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { ScheduleCreateSuccessResponse, ScheduleListSuccessResponse, ScheduleUpdateSuccessResponse, ScheduleErrorResponse } from './schedule.swagger';

@ApiTags('Schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) { }

  @Version('1')
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar novo agendamento com pagamento em cartão' })
  @ApiBody({ description: 'Objeto JSON contendo dados', type: CreateScheduleDto })
  @ApiResponse(ScheduleCreateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  createWithCard(@Body() createScheduleDto: CreateScheduleDto) {
    // Força o tipo de pagamento como 'credit_card'
    createScheduleDto.payment = {
      ...createScheduleDto.payment,
      type: 'credit_card'
    };
    return this.scheduleService.createWithCard(createScheduleDto);
  }
  @Version('1')
  @Get()
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Listar todos os agendamentos' })
  @ApiResponse(ScheduleListSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  findAll() {
    return this.scheduleService.findAll();
  }
  @Version('1')
  @Get(':id')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse(ScheduleCreateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(+id);
  }
  
  @Version('1')
  @Get('payment/:paymentId')
  @ApiOperation({ summary: 'Buscar agendamento por PaymentId' })
  @ApiResponse(ScheduleCreateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  findByPaymentId(@Param('paymentId') paymentId: string) {
    return this.scheduleService.findByPaymentId(paymentId);
  }

  @Version('1')
  @Get('professional/:professionalId')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Buscar agendamentos por ID do profissional' })
  @ApiResponse(ScheduleListSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  findByProfessional(@Param('professionalId') professionalId: string) {
    return this.scheduleService.findByProfessional(+professionalId);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  @ApiResponse(ScheduleUpdateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(+id, updateScheduleDto);
  }

  @Delete(':id')
  @Version('1')
  @Roles(Role.ADM, Role.PROFESSIONAL)
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse(ScheduleUpdateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(+id);
  }

  @Version('1')
  @Post('in-store')
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar novo agendamento para pagamento no balcão' })
  @ApiBody({ description: 'Objeto JSON contendo dados', type: CreateScheduleDto })
  @ApiResponse(ScheduleCreateSuccessResponse)
  @ApiResponse(ScheduleErrorResponse)
  createInStore(@Body() createScheduleDto: CreateScheduleDto) {
    // Força o tipo de pagamento como 'in_store'
    createScheduleDto.payment = {
      ...createScheduleDto.payment,
      type: 'in_store',
      status: 'pending'
    };
    return this.scheduleService.createInStore(createScheduleDto);
  }


}