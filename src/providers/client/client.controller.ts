import { Controller, Post, Body, HttpStatus, Get, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientInfoDto } from './dto/create-client.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: ClientInfoDto) {
    return this.clientService.create(createClientDto);
  }
}
