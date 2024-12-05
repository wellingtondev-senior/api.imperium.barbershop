import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { ServiceDto } from '../service/dto/service.dto';
import { JsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

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

  async create(createScheduleDto: CreateScheduleDto) {
    try {
      const { clientInfo, payment, services, date, time } = createScheduleDto;

      // Combina date e time em um único DateTime
      const dateTime = this.combineDateAndTime(date, time);

      // Find or create client
      let client: { id: number; cardName: string; email: string; phoneCountry: string; create_at: Date; update_at: Date; };
      const existingClient = await this.prisma.client.findFirst({
        where: { email: clientInfo.email }
      });

      if (existingClient) {
        client = existingClient;
      } else {
        client = await this.prisma.client.create({
          data: {
          cardName: clientInfo.cardName,
            email: clientInfo.email,
            phoneCountry: clientInfo.phoneCountry
          }
        });
      }

    

      // Validate services
      const serviceIds = services.map((service:ServiceDto) => service.id);
      const dbServices = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } }
      });

      if (dbServices.length !== services.length) {
        throw new BadRequestException('One or more services not found');
      }

      // Create payment record with Stripe response
      let createdPayment: { object: string; id: string; create_at: Date; update_at: Date; data: JsonValue; status: string | null; type: string; api_version: string; created: number; livemode: boolean; pending_webhooks: number; request: JsonValue; amount: number | null; currency: string | null; payment_method: string | null; client_secret: string | null; clientId: number;  scheduleId: number | null; };
      try {
        createdPayment = await this.prisma.payment.create({
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
            // Campos extraídos para consulta rápida
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            client_secret: payment.client_secret,
            clientId: client.id
          }
        });
      } catch (error) {
        throw new Error('Payment failed');
      }

      // Create schedule
      const schedule = await this.prisma.schedule.create({
        data: {
          dateTime: dateTime,
          time: time,
          client: {
            connect: { id: client.id }
          },
          professional: {
            connect: { id: createScheduleDto.professionalId }
          },
          status: createScheduleDto.payment.status,
          services: {
            connect: serviceIds.map(id => ({ id }))
          },
          Payment: {
            connect: { id: createdPayment.id }
          }
        },
        include: {
          client: true,
          services: true,
          Payment: true,
          professional: true
        },
      });

      return {
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error.message === 'Payment failed') {
        throw error;
      }
      console.error('Error creating schedule:', error);
      throw new Error('Error creating schedule');
    }
  }

  async findAll() {
    try {
      const schedules = await this.prisma.schedule.findMany({
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
      const schedule = await this.prisma.schedule.findUnique({
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
      const professional = await this.prisma.professional.findUnique({
        where: { id: professionalId }
      });

      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      const schedules = await this.prisma.schedule.findMany({
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
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const schedules = await this.prisma.schedule.findMany({
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

      const schedules = await this.prisma.schedule.findMany({
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
      const schedules = await this.prisma.schedule.findMany({
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

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      const updatedSchedule = await this.prisma.schedule.update({
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
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          Payment: true,
          professional: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      await this.prisma.schedule.update({
        where: { id },
        data: {
          status: "canceled" ,
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
      const schedule = await this.prisma.schedule.findUnique({
        where: { id }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      await this.prisma.schedule.delete({
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
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: { Payment: true }
      });

      if (!schedule || !schedule.Payment) {
        throw new NotFoundException('Schedule or Payment not found');
      }

      const updatedPayment = await this.prisma.payment.update({
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