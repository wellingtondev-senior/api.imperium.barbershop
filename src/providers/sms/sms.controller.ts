import { Controller, Post, Body, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { ReceivePayloadApiDto } from 'src/modulos/jobs/twilio/dto/payload-api.dto';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}
    
    @Version('1')
    @Post('send')
    @ApiOperation({ summary: 'Enviar SMS' })
    @ApiResponse({ status: 200, description: 'SMS enviado com sucesso' })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    async sendSms(@Body() payload: ReceivePayloadApiDto) {
        return this.smsService.sendSms(payload);
    }
}
