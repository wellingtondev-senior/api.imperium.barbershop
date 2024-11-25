import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { CreatePaymentDTO, StripeWebhookDTO, SendEmailConfirmPaymentDTO, SendEmailPaymentFailedDTO } from './dto/payment.dto';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { MailerService } from '../mailer/mailer.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly className: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
    private readonly mailerService: MailerService,
  ) {
    this.className = this.constructor.name;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async processPayment(createPaymentDTO: CreatePaymentDTO) {
    try {
      // Buscar agendamento
      const appointment = await this.prismaService.appointment.findUnique({
        where: { id: createPaymentDTO.appointmentId },
        include: {
          service: true,
          professional: {
            include: {
              user: true
            }
          }
        },
      });

      if (!appointment) {
        throw new HttpException('Agendamento não encontrado', HttpStatus.NOT_FOUND);
      }

      // Criar token do cartão
      const token = await this.stripe.tokens.create({
        card: {
          number: createPaymentDTO.card.number,
          exp_month: createPaymentDTO.card.exp_month,
          exp_year: createPaymentDTO.card.exp_year,
          cvc: createPaymentDTO.card.cvc,
        },
      });

      // Criar pagamento no Stripe
      const charge = await this.stripe.charges.create({
        amount: Math.round(appointment.service.price * 100), // Stripe trabalha com centavos
        currency: 'brl',
        source: token.id,
        metadata: {
          appointmentId: appointment.id.toString(),
        },
        description: `Pagamento para ${appointment.service.name} - Profissional: ${appointment.professional.name}`,
      });

      // Criar pagamento no banco de dados
      const payment = await this.prismaService.payment.create({
        data: {
          amount: appointment.service.price,
          status: charge.status,
          method: 'credit_card',
          stripePaymentId: charge.id, // Adicionando o ID do pagamento do Stripe
          serviceId: appointment.serviceId,
          appointment: {
            connect: {
              id: appointment.id,
            },
          },
        },
      });

      // Atualizar status do agendamento
      await this.prismaService.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'confirmed',
          paymentId: payment.id,
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: {
          paymentId: payment.id,
          status: payment.status,
          appointmentId: appointment.id,
        },
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'processPayment',
        message: error.message,
      });
      throw new HttpException(
        error.message || 'Erro ao processar pagamento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleWebhook(webhookData: StripeWebhookDTO) {
    try {
      const appointmentId = parseInt(webhookData.data.object.metadata.appointmentId);
      
      // Buscar informações do agendamento com todas as relações necessárias
      const appointment = await this.prismaService.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          service: true,
          professional: {
            include: {
              user: true
            }
          },
          client: true
        },
      });

      if (!appointment) {
        throw new HttpException('Agendamento não encontrado', HttpStatus.NOT_FOUND);
      }

      // Buscar pagamento existente
      const payment = await this.prismaService.payment.findFirst({
        where: {
          appointment: {
            id: appointmentId,
          },
        },
      });

      if (!payment) {
        throw new HttpException('Pagamento não encontrado', HttpStatus.NOT_FOUND);
      }

      switch (webhookData.type) {
        case 'charge.succeeded':
          // Atualizar status do pagamento
          await this.prismaService.payment.update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              stripePaymentId: webhookData.data.object.id,
            },
          });

          // Atualizar status do agendamento
          await this.prismaService.appointment.update({
            where: { id: appointmentId },
            data: {
              status: 'confirmed',
            },
          });

          // Enviar email de confirmação para o profissional
          await this.mailerService.sendEmailConfirmPayment({
            to: appointment.professional.user.email,
            subject: 'Pagamento Confirmado - Imperium Barbershop',
            template: 'payment-success',
            context: {
              serviceName: appointment.service.name,
              professionalName: appointment.professional.name,
              clientName: appointment.client.name,
              date: appointment.date,
              amount: webhookData.data.object.amount / 100,
              appointmentId: appointment.id,
              paymentId: payment.id,
            },
          });

          // Enviar email de confirmação para o cliente
          if (appointment.client.email) {
            await this.mailerService.sendEmailConfirmPayment({
              to: appointment.client.email,
              subject: 'Pagamento Confirmado - Imperium Barbershop',
              template: 'payment-success-client',
              context: {
                serviceName: appointment.service.name,
                professionalName: appointment.professional.name,
                clientName: appointment.client.name,
                date: appointment.date,
                amount: webhookData.data.object.amount / 100,
                appointmentId: appointment.id,
              },
            });
          }

          this.loggerService.log({
            className: this.className,
            functionName: 'handleWebhook',
            message: `Pagamento confirmado para agendamento ${appointmentId}`,
          });
          break;

        case 'charge.failed':
          // Atualizar status do pagamento
          await this.prismaService.payment.update({
            where: { id: payment.id },
            data: {
              status: 'failed',
              stripePaymentId: webhookData.data.object.id,
            },
          });

          // Atualizar status do agendamento
          await this.prismaService.appointment.update({
            where: { id: appointmentId },
            data: {
              status: 'cancelled',
            },
          });

          // Enviar email de falha para o profissional
          await this.mailerService.sendEmailPaymentFailed({
            to: appointment.professional.user.email,
            subject: 'Falha no Pagamento - Imperium Barbershop',
            template: 'payment-failed',
            context: {
              serviceName: appointment.service.name,
              professionalName: appointment.professional.name,
              clientName: appointment.client.name,
              date: appointment.date,
              amount: webhookData.data.object.amount / 100,
              appointmentId: appointment.id,
              paymentId: payment.id,
              errorMessage: webhookData.data.object.failure_message || 'Erro no processamento do pagamento',
            },
          });

          // Enviar email de falha para o cliente
          if (appointment.client.email) {
            await this.mailerService.sendEmailPaymentFailed({
              to: appointment.client.email,
              subject: 'Falha no Pagamento - Imperium Barbershop',
              template: 'payment-failed-client',
              context: {
                serviceName: appointment.service.name,
                professionalName: appointment.professional.name,
                date: appointment.date,
                amount: webhookData.data.object.amount / 100,
                appointmentId: appointment.id,
                errorMessage: webhookData.data.object.failure_message || 'Erro no processamento do pagamento',
              },
            });
          }

          this.loggerService.error({
            className: this.className,
            functionName: 'handleWebhook',
            message: `Falha no pagamento para agendamento ${appointmentId}`,
            error: webhookData.data.object.failure_message,
          });
          break;

        case 'payment_intent.payment_failed':
          this.loggerService.log({
            className: this.className,
            functionName: 'handleWebhook',
            message: 'Pagamento falhou',
          });

          // Buscar o agendamento relacionado ao pagamento
          appointment = await this.prismaService.appointment.findFirst({
            where: {
              paymentIntentId: webhookData.data.object.id,
            },
            include: {
              professional: {
                include: {
                  user: true,
                },
              },
              client: true,
              service: true,
            },
          });

          if (!appointment) {
            throw new HttpException('Agendamento não encontrado', HttpStatus.NOT_FOUND);
          }

          // Atualizar status do agendamento
          await this.prismaService.appointment.update({
            where: { id: appointment.id },
            data: {
              status: 'PAYMENT_FAILED',
            },
          });

          // Enviar email de falha para o profissional
          await this.mailerService.sendEmailPaymentFailed({
            to: appointment.professional.user.email,
            subject: 'Falha no Pagamento - Imperium Barbershop',
            template: 'payment-failed',
            context: {
              serviceName: appointment.service.name,
              professionalName: appointment.professional.name,
              clientName: appointment.client.name,
              date: appointment.date,
              amount: webhookData.data.object.amount / 100,
              appointmentId: appointment.id,
              errorMessage: webhookData.data.object.last_payment_error?.message || 'Erro desconhecido',
            },
          });

          // Enviar email de falha para o cliente
          if (appointment.client.email) {
            await this.mailerService.sendEmailPaymentFailed({
              to: appointment.client.email,
              subject: 'Falha no Pagamento - Imperium Barbershop',
              template: 'payment-failed',
              context: {
                serviceName: appointment.service.name,
                professionalName: appointment.professional.name,
                clientName: appointment.client.name,
                date: appointment.date,
                amount: webhookData.data.object.amount / 100,
                appointmentId: appointment.id,
                errorMessage: webhookData.data.object.last_payment_error?.message || 'Erro desconhecido',
              },
            });
          }

          break;

        default:
          this.loggerService.log({
            className: this.className,
            functionName: 'handleWebhook',
            message: `Tipo de webhook não reconhecido: ${webhookData.type}`,
          });
          break;
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Webhook processado com sucesso',
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'handleWebhook',
        message: `Erro ao processar webhook: ${error.message}`,
        error,
      });
      throw new HttpException(
        error.message || 'Erro ao processar webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
