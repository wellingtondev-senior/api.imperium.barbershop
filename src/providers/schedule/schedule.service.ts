import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { ServiceDto } from '../service/dto/service.dto';
import { SmsService } from '../sms/sms.service';
import { NotificationService } from '../notification/notification.service';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly notificationService: NotificationService
  ) { }

  private combineDateAndTime(date: Date, time: string): Date {
    try {
      // Extrair apenas a data do ISO string
      const dateOnly = new Date(date).toISOString().split('T')[0];
      // Combina a data e hora em uma string ISO
      const dateTimeString = `${dateOnly}T${time}:00`;
      const dateTime = new Date(dateTimeString);

      if (isNaN(dateTime.getTime())) {
        throw new BadRequestException('Invalid date or time format');
      }

      return dateTime;
    } catch (error) {
      throw new BadRequestException('Error combining date and time');
    }
  }

  private formatScheduleMessage(schedule: any, services: any[]): string {
    try {
      const dateTime = new Date(schedule.dateTime);
      if (isNaN(dateTime.getTime())) {
        throw new Error('Invalid date');
      }
      const formattedDate = format(dateTime, "MMMM dd, yyyy", { locale: enUS });
      const servicesNames = services.map(service => service.name).join(', ');
      const totalValue = services.reduce((total, service) => total + service.price, 0);

      return `Hello ${schedule.client.cardName}! Your appointment has been confirmed:\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${schedule.time}\n` +
        `Services: ${servicesNames}\n` +
        `Total Value: U$ ${totalValue.toFixed(2)}\n` +
        `Professional: ${schedule.professional.name}`;
    } catch (error) {
      this.logger.error('Error formatting schedule message:', error);
      return 'Error formatting schedule message. Your appointment has been confirmed but please contact support for details.';
    }
  }



  private async validateAndPrepareSchedule(createScheduleDto: CreateScheduleDto) {
    const { clientInfo, services, date, time } = createScheduleDto;

    // Check if professional exists
    const professional = await this.prismaService.professional.findUnique({
      where: { id: createScheduleDto.professionalId }
    });

    if (!professional) {
      throw new BadRequestException('Professional not found');
    }

    // Combina date e time em um único DateTime
    const dateTime = this.combineDateAndTime(date, time);
    
    // Find or create client
    let client = await this.prismaService.client.findFirst({
      where: { email: clientInfo.email }
    });

    if (!client) {
      client = await this.prismaService.client.create({
        data: {
          cardName: clientInfo.cardName,
          email: clientInfo.email,
          phoneCountry: "+" + clientInfo.phoneCountry
        }
      });
    }

    // Verify if all services exist
    const serviceIds = services.map((service: ServiceDto) => service.id);
    const servicesExist = await this.prismaService.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      }
    });

    if (servicesExist.length !== serviceIds.length) {
      throw new BadRequestException('One or more services not found');
    }

    return { professional, client, dateTime };
  }

  private async sendNotifications(createdSchedule: any) {
    // Enviar notificações para o profissional e ADMs
    await this.notificationService.sendScheduleNotification(createdSchedule);

    // Enviar SMS para o cliente
    if (createdSchedule.client.phoneCountry) {
      const statusMessage = createdSchedule.status_schedule;

      const clientAppointmentData = {
        to: createdSchedule.client.phoneCountry,
        client: createdSchedule.client.cardName,
        service: createdSchedule.services.map(service => ({
          name: service.name,
          price: service.price
        })),
        appointmentDate: createdSchedule.dateTime,
        barberName: createdSchedule.professional.name,
        link: `${process.env.URL_FRONTEND}/schedule/confirmation/${createdSchedule.paymentId}`,
        additionalMessage: statusMessage
      };
      
      await this.smsService.sendAppointmentMessage(clientAppointmentData, false);
    }

    // Enviar SMS para o profissional
    if (createdSchedule.professional.phone) {
      const professionalAppointmentData = {
        to: createdSchedule.professional.phone,
        client: createdSchedule.client.cardName,
        service: createdSchedule.services.map(service => ({
          name: service.name,
          price: service.price
        })),
        appointmentDate: createdSchedule.dateTime,
        barberName: createdSchedule.professional.name,
      };
      
      await this.smsService.sendAppointmentMessage(professionalAppointmentData, true);
    }
  }

  async createInStore(createScheduleDto: CreateScheduleDto) {
    try {
      const { payment, services, time } = createScheduleDto;
      const { professional, client, dateTime } = await this.validateAndPrepareSchedule(createScheduleDto);

      // Criar ID único para pagamento no balcão
      const paymentId = `in_store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar pagamento no balcão
      const createdPayment = await this.prismaService.payment.create({
        data: {
          id: paymentId,
          object: 'in_store_payment',
          type: 'in_store.created',
          api_version: '1.0.0',
          created: Math.floor(Date.now() / 1000),
          data: JSON.parse(JSON.stringify({ object: { type: 'in_store' } })),
          livemode: false,
          pending_webhooks: 0,
          request: JSON.parse(JSON.stringify({
            id: paymentId,
            idempotency_key: null
          })),
          amount: payment.amount,
          currency: 'USD',
          status: 'pending',
          payment_method: 'in_store',
          client_secret: null,
          clientId: client.id,
        }
      });

      // Criar agendamento
      const createdSchedule = await this.prismaService.schedule.create({
        data: {
          dateTime,
          time,
          status_schedule: 'pending',
          status_payment: 'pending',
          type_payment: 'in_store',
          is_confirmed: false,
          professionalId: professional.id,
          clientId: client.id,
          services: {
            connect: services.map((service) => ({
              id: service.id
            }))
          },
          paymentId: createdPayment.id
        },
        include: {
          client: true,
          professional: true,
          services: true,
          Payment: true
        }
      });

      await this.sendNotifications(createdSchedule);

      return {
        success: true,
        message: 'Schedule created successfully',
        data: createdSchedule
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error creating in-store schedule: ${error.message}`);
    }
  }

  async createWithCard(createScheduleDto: CreateScheduleDto) {
    try {
      const { payment, services, time } = createScheduleDto;
      const { professional, client, dateTime } = await this.validateAndPrepareSchedule(createScheduleDto);

      // Criar pagamento com cartão
      const createdPayment = await this.prismaService.payment.create({
        data: {
          id: payment.id,
          object: 'payment_intent',
          type: 'payment_intent.created',
          api_version: '2024-11-20.acacia',
          created: payment.created,
          data: JSON.parse(JSON.stringify({ object: payment })),
          livemode: payment.livemode,
          pending_webhooks: 0,
          request: JSON.parse(JSON.stringify({
            id: payment.id,
            idempotency_key: null
          })),
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_method: payment.payment_method as string,
          client_secret: payment.client_secret,
          clientId: client.id,
        }
      });

      // Criar agendamento
      const createdSchedule = await this.prismaService.schedule.create({
        data: {
          dateTime,
          time,
          status_schedule: 'pending',
          status_payment: payment.status || 'pending',
          type_payment: 'credit_card',
          is_confirmed: payment.status === 'succeeded',
          professionalId: professional.id,
          clientId: client.id,
          services: {
            connect: services.map((service) => ({
              id: service.id
            }))
          },
          paymentId: createdPayment.id
        },
        include: {
          client: true,
          professional: true,
          services: true,
          Payment: true
        }
      });

      await this.sendNotifications(createdSchedule);

      return {
        success: true,
        message: 'Schedule created successfully',
        data: createdSchedule
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error creating card payment schedule: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const schedules = await this.prismaService.schedule.findMany({
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        },
        orderBy: {
          dateTime: 'desc'
        }
      });
     
      return {
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules
      };
    } catch (error) {
      throw new Error(`Error retrieving schedules: ${error.message}`);
    }
  }

  async findOne(id: number) {
    try {
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      return {
        success: true,
        message: 'Schedule retrieved successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error retrieving schedule: ${error.message}`);
    }
  }

  async findByProfessional(professionalId: number) {
    try {
      const professional = await this.prismaService.professional.findUnique({
        where: { id: professionalId },
        include: {
          schedules: true,
          user: true,
          services: true,
        }
      });

      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      const schedules = await this.prismaService.schedule.findMany({
        where: { professionalId },
        orderBy: {
          dateTime: 'desc'
        },
        include: {
          professional: true,
          client: true,
          services: true,
        }

      });

      return {
        success: true,
        message: 'Professional schedules retrieved successfully',
        data: schedules.map((schedule) => {
          return {
            ...schedule,
            paymentId:null
          }
        })
      };
    
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error retrieving professional schedules: ${error.message}`);
    }
  }

  async findByClient(clientId: number) {
    try {
      const client = await this.prismaService.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const schedules = await this.prismaService.schedule.findMany({
        where: { clientId },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        },
        orderBy: {
          dateTime: 'desc'
        }
      });

      return {
        success: true,
        message: 'Client schedules retrieved successfully',
        data: schedules
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error retrieving client schedules: ${error.message}`);
    }
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      if (startDate > endDate) {
        throw new BadRequestException('Invalid date range');
      }

      const schedules = await this.prismaService.schedule.findMany({
        where: {
          dateTime: {
            gte: startDate,
            lte: endDate,
          }
        },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true,
        },
      });

      return {
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error retrieving schedules by date range: ${error.message}`);
    }
  }

  async findByStatus(status: string) {
    try {
      const schedules = await this.prismaService.schedule.findMany({
        where: {
          OR: [
            { status_schedule: status },
            { status_payment: status }
          ]
        },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true,
        },
      });

      return {
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
      };
    } catch (error) {
      throw new Error(`Error retrieving schedules by status: ${error.message}`);
    }
  }

  async findByPaymentId(paymentId: string) {
    try {
      // Buscamos o schedule diretamente usando o paymentId
      const schedule = await this.prismaService.schedule.findFirst({
        where: {
          paymentId: paymentId
        },
        include: {
          client: true,
          professional: true,
          services: true,
          Payment: true
        }
      });
      const payment = await this.prismaService.payment.findFirst({
        where: {
          id: paymentId
        },
      });



      if (!schedule) {
        throw new NotFoundException(`Schedule with payment ID ${paymentId} not found`);
      }

      return {
        success: true,
        message: 'Schedule found successfully',
        data: {
          ...schedule,
          Payment: payment
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error finding schedule: ${error.message}`);
    }
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    try {
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      const updatedSchedule = await this.prismaService.schedule.update({
        where: { id },
        data: {
          ...(updateScheduleDto.status_schedule && { status_schedule: updateScheduleDto.status_schedule }),
          ...(updateScheduleDto.status_payment && { status_payment: updateScheduleDto.status_payment }),
          ...(updateScheduleDto.type_payment && { type_payment: updateScheduleDto.type_payment }),
          ...(typeof updateScheduleDto.is_confirmed !== 'undefined' && { is_confirmed: updateScheduleDto.is_confirmed })
        },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        }
      });

      let smsStatus = { sent: false, message: 'No SMS needed' };

      // Verifica se houve mudança de status que requer notificação
      if (
        (updateScheduleDto.status_schedule && updateScheduleDto.status_schedule !== schedule.status_schedule) ||
        (updateScheduleDto.status_payment && updateScheduleDto.status_payment !== schedule.status_payment) ||
        (typeof updateScheduleDto.is_confirmed !== 'undefined' && updateScheduleDto.is_confirmed !== schedule.is_confirmed)
      ) {
        try {
          // Prepara a mensagem com base no novo status
          let statusMessage = '';
          if (updateScheduleDto.status_schedule) {
            statusMessage = `Appointment status updated to: ${updateScheduleDto.status_schedule}`;
          }
          if (updateScheduleDto.status_payment) {
            statusMessage += `\nPayment status: ${updateScheduleDto.status_payment}`;
          }
          if (typeof updateScheduleDto.is_confirmed !== 'undefined') {
            statusMessage += `\nConfirmation status: ${updateScheduleDto.is_confirmed ? 'Confirmed' : 'Not confirmed'}`;
          }

          // Envia SMS para o cliente
          if (updatedSchedule.client.phoneCountry) {
            await this.smsService.sendAppointmentMessage({
              to: updatedSchedule.client.phoneCountry,
              client: updatedSchedule.client.cardName,
              service: updatedSchedule.services.map(service => ({
                name: service.name,
                price: service.price
              })),
              appointmentDate: updatedSchedule.dateTime,
              barberName: updatedSchedule.professional.name,
              link: `${process.env.URL_FRONTEND}/schedule/confirmation/${updatedSchedule.paymentId}`,
              additionalMessage: statusMessage
            });
            smsStatus = { sent: true, message: 'Status update SMS sent successfully' };
          }
        } catch (smsError) {
          this.logger.error('Error sending status update SMS:', smsError);
          smsStatus = { sent: false, message: 'Failed to send status update SMS' };
        }
      }

      return {
        success: true,
        message: 'Schedule updated successfully',
        data: updatedSchedule,
        notification: smsStatus
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error updating schedule: ${error.message}`);
    }
  }

  async cancel(id: number) {
    try {
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id },
        include: {
          Payment: true,
          professional: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      await this.prismaService.schedule.update({
        where: { id },
        data: {
          status_schedule: "canceled",
          status_payment: "canceled",
          is_confirmed: false,
          Payment: {
            update: {
              where: { id: schedule.Payment ? schedule.Payment[0].id : undefined },
              data: { status: "canceled" }
            }
          }
        },
        include: {
          client: true,
          services: true,
          Payment: true,
          professional: true
        }
      });

      return {
        success: true,
        message: 'Schedule canceled successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error canceling schedule: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      await this.prismaService.schedule.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Schedule deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error deleting schedule: ${error.message}`);
    }
  }

  async updatePaymentStatus(id: number, status: string) {
    try {
      const schedule = await this.prismaService.schedule.findUnique({
        where: { id },
        include: { Payment: true }
      });

      if (!schedule || !schedule.Payment) {
        throw new NotFoundException('Schedule or Payment not found');
      }

      const updatedPayment = await this.prismaService.payment.update({
        where: { id: schedule.Payment[0].id },
        data: { status }
      });

      return {
        success: true,
        message: 'Payment status updated successfully',
        data: updatedPayment
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error updating payment status');
    }
  }
}