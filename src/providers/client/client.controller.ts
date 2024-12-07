import { Controller, Post, Body, HttpStatus, Get, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientScheduleDto } from './dto/client.dto';

@ApiTags('Client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: ClientScheduleDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  findAll() {
    return this.clientService.findAll();
  }
}
