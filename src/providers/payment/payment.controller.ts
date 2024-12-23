import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Version, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  
  @Version('1')
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações de webhook do Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Payload do webhook inválido' })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
  ) {
    return this.paymentService.processWebhook(payload);
  }

  @Version('1')
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista todos os pagamentos filtrados por status' })
  @ApiResponse({ status: 200, description: 'Pagamentos listados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao listar pagamentos' })
  async findAll(@Query('status') status?: string) {
    return this.paymentService.findAll(status);
  }
}
