import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleStatus } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { StripeService } from '../../modulos/stripe/stripe.service';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    try {
      // Validate professional
      const professional = await this.prisma.professional.findUnique({
        where: { id: createScheduleDto.professionalId },
        include: { workingHours: true }
      });
      
      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      // Validate services
      const services = await this.prisma.service.findMany({
        where: { id: { in: createScheduleDto.servicesId } }
      });

      if (services.length !== createScheduleDto.servicesId.length) {
        throw new BadRequestException('One or more services not found');
      }

      // Check availability
      const existingSchedule = await this.prisma.schedule.findFirst({
        where: {
          professionalId: createScheduleDto.professionalId,
          date: new Date(createScheduleDto.dateTime),
          status: { not: ScheduleStatus.CANCELED }
        }
      });

      if (existingSchedule) {
        throw new BadRequestException('Professional is not available at this time');
      }

      // Check if the time is within working hours
      const scheduleDate = new Date(createScheduleDto.dateTime);
      const dayOfWeek = scheduleDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const scheduleHour = scheduleDate.getHours();
      const scheduleMinutes = scheduleDate.getMinutes();

      // Only check working hours if they are defined
      if (professional.workingHours && typeof professional.workingHours === 'object') {
        const workingHours = professional.workingHours[dayOfWeek];
        if (workingHours) {
          const [startHour, startMinute] = workingHours.start.split(':').map(Number);
          const [endHour, endMinute] = workingHours.end.split(':').map(Number);
          const startTime = startHour * 60 + startMinute;
          const endTime = endHour * 60 + endMinute;
          const scheduleTimeMinutes = scheduleHour * 60 + scheduleMinutes;

          if (scheduleTimeMinutes < startTime || scheduleTimeMinutes >= endTime) {
            throw new BadRequestException('Professional is not available at this time');
          }
        }
      }

      const { clientInfo, payment } = createScheduleDto;

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

      // Process payment with Stripe
      let createdPayment;
      try {
        const paymentResult = await this.stripeService.processPayment(createScheduleDto);
        if (!paymentResult.success) {
          throw new Error('Payment failed');
        }

        // Create payment record
        createdPayment = await this.prisma.payment.create({
          data: {
            amount: payment.amount,
            method: payment.method,
            cardNumber: payment.cardNumber,
            cardExpiry: payment.cardExpiry,
            cardCvv: payment.cardCvv,
            clientId: client.id,
            status: ScheduleStatus.PENDING,
            stripePaymentId: paymentResult.data?.stripePaymentId || null
          },
        });
      } catch (error) {
        throw new Error('Payment failed');
      }

      // Create schedule
      const schedule = await this.prisma.schedule.create({
        data: {
          date: new Date(createScheduleDto.dateTime),
          notes: createScheduleDto.notes,
          professionalId: createScheduleDto.professionalId,
          clientId: client.id,
          paymentId: createdPayment.id,
          status: ScheduleStatus.PENDING,
          services: {
            connect: createScheduleDto.servicesId.map(id => ({ id }))
          }
        },
        include: {
          professional: true,
          client: true,
          services: true,
          payment: true
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
          payment: true
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
          payment: true
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
          payment: true
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
          payment: true
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
          payment: true,
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

  async findByStatus(status: ScheduleStatus) {
    try {
      const schedules = await this.prisma.schedule.findMany({
        where: { status },
        include: {
          professional: true,
          client: true,
          services: true,
          payment: true,
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
          payment: true
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
          payment: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          status: ScheduleStatus.CANCELED,
          payment: {
            update: {
              status: ScheduleStatus.CANCELED
            }
          }
        },
        include: {
          professional: true,
          client: true,
          services: true,
          payment: true
        }
      });

      return {
        success: true,
        message: 'Schedule canceled successfully',
        data: updatedSchedule
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

  async updatePaymentStatus(id: number, status: ScheduleStatus) {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: { payment: true }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      const updatedPayment = await this.prisma.payment.update({
        where: { id: schedule.payment.id },
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