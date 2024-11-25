import { Controller, Post, Body, Version, UseGuards, Headers, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiTags, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CreatePaymentDTO, StripeWebhookDTO } from './dto/payment.dto';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/enums/role.enum';

@ApiTags('Pagamentos')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Version('1')
  @Post('process')
  @ApiOperation({ summary: 'Processa pagamento de um agendamento' })
  @ApiResponse({
    status: 201,
    description: 'Pagamento processado com sucesso',
  })
  @Roles(Role.MASTER, Role.ADM)
  @UseGuards(RoleGuard)
  @HttpCode(201)
  async processPayment(@Body() createPaymentDTO: CreatePaymentDTO) {
    return await this.paymentService.processPayment(createPaymentDTO);
  }

  @Version('1')
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook para receber notificações do Stripe' })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Assinatura do webhook do Stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() webhookData: StripeWebhookDTO,
  ) {
    return await this.paymentService.handleWebhook(webhookData);
  }
}
