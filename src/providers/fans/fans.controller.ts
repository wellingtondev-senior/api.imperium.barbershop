import { Body, Controller, HttpCode, Param, Post, Version } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FansService } from './fans.service';
import { ConfirmEmailFansDto, CreateFansDto } from './dto/fans.dto';
import { FansSuccessResponse } from './fans.swagger';

@ApiTags('Cliente')
@Controller('client')
export class FansController { 

    constructor(private FansService: FansService) { 

    }
    @Version('1')
    @Post("/create")  
    @ApiOperation({ summary: 'Cria um novo usuario na plataforma conhecida como Fan ou entusiasta' })
    @ApiBody({description: 'Objeto JSON contendo dados,', type: CreateFansDto }) 
    @HttpCode(201)
    @ApiResponse(FansSuccessResponse) 
    async create(@Body() Fans:CreateFansDto) {
        return await this.FansService.create(Fans)
    }


   


}
