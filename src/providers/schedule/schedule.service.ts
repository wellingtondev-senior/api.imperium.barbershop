import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { ServiceDto } from '../service/dto/service.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    try {
      const { clientInfo, payment, services, dateTime } = createScheduleDto;

      // Find or create client
      let client;
      const existingClient = await this.prisma.client.findFirst({
        where: { email: clientInfo.email }
      });

      if (existingClient) {
        client = existingClient;
      } else {
        client = await this.prisma.client.create({
          data: {
            name: clientInfo.name,
            email: clientInfo.email,
            phone: clientInfo.phone,
            phoneCountry: clientInfo.phoneCountry
          }
        });
      }

      // Validate professional
      const professional = await this.prisma.professional.findUnique({
        where: { id: 1 } // Você precisa passar o ID correto do profissional aqui
      });

      if (!professional) {
        throw new BadRequestException('Professional not found');
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
      let createdPayment;
      try {
        createdPayment = await this.prisma.payment.create({
          data: {
            id: payment.id,
            object: payment.object,
            amount: payment.amount,
            amount_details_tip: JSON.stringify(payment.amount_details?.tip || null),
            capture_method: payment.capture_method,
            client_secret: payment.client_secret,
            confirmation_method: payment.confirmation_method,
            created: payment.created,
            currency: payment.currency,
            livemode: payment.livemode,
            payment_method: payment.payment_method,
            payment_method_types: payment.payment_method_types,
            status: payment.status,
            clientId: client.id
          }
        });
      } catch (error) {
        throw new Error('Payment failed');
      }

      // Create schedule
      const schedule = await this.prisma.schedule.create({
        data: {
          date: new Date(dateTime),
          client: {
            connect: { id: client.id }
          },
          professional: {
            connect: { id: professional.id }
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
          date: 'desc'
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
          date: 'desc'
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
          date: 'desc'
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
          date: {
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