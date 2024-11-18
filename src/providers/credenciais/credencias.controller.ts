import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Version } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CredenciaisService } from './credencias.service';
import { CredenciaisDto } from './dto/credenciais.dto';


@Controller()
export class CredenciaisController {

  constructor(
    private readonly credenciaisService: CredenciaisService,
  ) { }

}
