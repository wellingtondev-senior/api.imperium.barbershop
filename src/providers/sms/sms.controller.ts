import { Controller, Post, Body, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { AppointmentDataDto } from './dto/sms.payload.dto';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
    constructor(private readonly smsService: SmsService) {}
    @Version('1')
    @Post()
    @ApiOperation({ summary: 'Send SMS' })
    @ApiResponse({ status: 200, description: 'SMS sent successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async sendSms(@Body() payload: AppointmentDataDto) {
        return this.smsService.sendAppointmentMessage(payload);
    }
}
