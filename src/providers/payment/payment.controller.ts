import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações de webhook do Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Payload do webhook inválido' })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentService.processWebhook(payload);
  }
}
