import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto, UpdateScheduleDto, ScheduleStatus } from './dto/schedule.dto';
import { PrismaService } from '../../modulos/prisma/prisma.service';

@Injectable()
export class ScheduleService {
  [x: string]: any;
  constructor(private readonly prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto) {
    try {
      // 1. Verify if professional exists
      const professional = await this.prisma.professional.findUnique({
        where: { id: createScheduleDto.professionalId }
      });

      if (!professional) {
        throw new NotFoundException('Professional not found');
      }

      // 2. Verify if all services exist
      const services = await this.prisma.service.findMany({
        where: {
          id: {
            in: createScheduleDto.servicesId
          }
        }
      });

      if (services.length !== createScheduleDto.servicesId.length) {
        throw new BadRequestException('One or more services not found');
      }

      // 3. Check if the time slot is available
      const existingSchedule = await this.prisma.schedule.findFirst({
        where: {
          AND: [
            { professionalId: createScheduleDto.professionalId },
            { date: new Date(createScheduleDto.dateTime) },
            { status: { not: ScheduleStatus.CANCELED } }
          ]
        }
      });

      if (existingSchedule) {
        throw new BadRequestException('This time slot is already booked');
      }

      // 4. Find or create client
      let client = await this.prisma.client.findFirst({
        where: {
          email: createScheduleDto.clientInfo.email
        }
      });

      if (!client) {
        // Create new client with user
        client = await this.prisma.client.create({
          data: {
            name: createScheduleDto.clientInfo.name,
            email: createScheduleDto.clientInfo.email,
            phone: createScheduleDto.clientInfo.phone,
            
          }
        });
      }

      // 5. Create payment
      const payment = await this.prisma.payment.create({
        data: {
          amount: createScheduleDto.amount,
          value: createScheduleDto.value,
          method: createScheduleDto.method,
          status: ScheduleStatus.PENDING,
          service: {
            connect: { id: createScheduleDto.servicesId[0] }
          },
          stripePaymentId: '', // This should be handled with actual Stripe integration
        }
      });

      // 6. Create schedule
      const schedule = await this.prisma.schedule.create({
        data: {
          date: new Date(createScheduleDto.dateTime),
          status: ScheduleStatus.PENDING,
          notes: createScheduleDto.observation,
          professional: {
            connect: { id: createScheduleDto.professionalId }
          },
          client: {
            connect: { id: client.id }
          },
          service: {
            connect: { id: createScheduleDto.servicesId[0] }
          },
          payment: {
            connect: { id: payment.id }
          }
        },
        include: {
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        }
      });

      return {
        statusCode: 201,
        message: 'Schedule created successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }

  async findAll() {
    try {
      const schedules = await this.prisma.schedule.findMany({
        include: {
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      return {
        statusCode: 200,
        message: 'Schedules retrieved successfully',
        data: schedules
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
        include: {
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        }
      });

      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      return {
        statusCode: 200,
        message: 'Schedule retrieved successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
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
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      return {
        statusCode: 200,
        message: 'Professional schedules retrieved successfully',
        data: schedules
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
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
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      return {
        statusCode: 200,
        message: 'Client schedules retrieved successfully',
        data: schedules
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    try {
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new NotFoundException('Schedule not found');
      }

      const schedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          status: updateScheduleDto.status,
          payment: {
            update: {
              status: updateScheduleDto.status
            }
          }
        },
        include: {
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        }
      });

      return {
        statusCode: 200,
        message: 'Schedule updated successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }

  async cancel(id: number) {
    try {
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new NotFoundException('Schedule not found');
      }

      const schedule = await this.prisma.schedule.update({
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
          professional: {
            include: {
              workingHours: true,
              services: true
            }
          },
          service: true,
          payment: true,
          client: true
        }
      });

      return {
        statusCode: 200,
        message: 'Schedule canceled successfully',
        data: schedule
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }

  async remove(id: number) {
    try {
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new NotFoundException('Schedule not found');
      }

      await this.prisma.schedule.delete({
        where: { id }
      });

      return {
        statusCode: 200,
        message: 'Schedule deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(error.message);
    }
  }
}