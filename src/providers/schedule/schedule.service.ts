import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { ServiceDto } from '../service/dto/service.dto';
import { JsonValue } from '@prisma/client/runtime/library';
import { SmsService } from '../sms/sms.service';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService
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
        `Professional: ${schedule.professional.name}\n\n` +
        `Payment Status: ${schedule.Payment[0].status === 'succeeded' ? 'Confirmed' : 'Pending'}`;
    } catch (error) {
      this.logger.error('Error formatting schedule message:', error);
      return 'Error formatting schedule message. Your appointment has been confirmed but please contact support for details.';
    }
  }

  private async sendScheduleConfirmationSMS(schedule: any) {
    try {
      const message = this.formatScheduleMessage(schedule, schedule.services);

      await this.smsService.sendSms({
        to: schedule.client.phoneCountry,
        message
      });
    } catch (error) {
      this.logger.error('Error sending SMS:', error);
      // We don't throw the error to avoid interrupting the main flow
    }
  }

  async create(createScheduleDto: CreateScheduleDto) {
    try {
      const { clientInfo, payment, services, date, time } = createScheduleDto;

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

      // Primeiro criamos o schedule
      const createdSchedule = await this.prismaService.schedule.create({
        data: {
          dateTime,
          time,
          professionalId: createScheduleDto.professionalId,
          clientId: client.id,
          services: {
            connect: services.map((service) => ({
              id: service.id
            }))
          },
          paymentId: payment.id // Definimos o paymentId aqui
        },
        include: {
          client: true,
          professional: true,
          services: true
        }
      });

      // Depois criamos o payment já vinculado ao schedule
      const createdPayment = await this.prismaService.payment.create({
        data: {
          id: payment.id,
          object: 'payment_intent',
          type: 'payment_intent.created',
          api_version: "2024-11-20.acacia",
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

      // Buscamos o schedule completo com todas as relações
      const completeSchedule = await this.prismaService.schedule.findUnique({
        where: { id: createdSchedule.id },
        include: {
          client: true,
          professional: true,
          services: true,
          Payment: true
        }
      });

      // Send SMS confirmation
      await this.sendScheduleConfirmationSMS(completeSchedule);

      return {
        success: true,
        message: 'Schedule created successfully',
        data: completeSchedule
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error creating schedule: ${error.message}`);
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
        where: { id: professionalId }
      });

      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      const schedules = await this.prismaService.schedule.findMany({
        where: { professionalId },
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
        message: 'Professional schedules retrieved successfully',
        data: schedules
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
        where: { status },
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
        where: { id }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      const updatedSchedule = await this.prismaService.schedule.update({
        where: { id },
        data: {
          status: updateScheduleDto.status
        },
        include: {
          professional: true,
          client: true,
          services: true,
          Payment: true
        }
      });

      return {
        success: true,
        message: 'Schedule updated successfully',
        data: updatedSchedule
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
          status: "canceled",
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