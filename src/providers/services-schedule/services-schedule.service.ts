import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { ServicesScheduleDto, CreateAppointmentDto, UpdateAppointmentDto, CreatePaymentDto, ServiceStatus } from './dto/services-schedule.dto';
import { Role } from '../../enums/role.enum';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class ServicesScheduleService {
  private className: string
  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
    private readonly sessionHashService: SessionHashService,
    private readonly mailerService: MailerService
  ) {
    this.className = this.constructor.name;
  }

  // Service CRUD
  async create(createServicesScheduleDto: ServicesScheduleDto) {
    try {
      const existingService = await this.prismaService.service.findUnique({
        where: { name: createServicesScheduleDto.name}
      });

      if (existingService) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "Service name already exists"
        };
      }

      const service = await this.prismaService.service.create({
        data: createServicesScheduleDto
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: "Service created successfully",
        data: service
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'create',
        message: `Error creating service: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findAll() {
    try {
      const services = await this.prismaService.service.findMany({
        include: {
          appointment: true,
          payment: true
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: "Services retrieved successfully",
        data: services
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAll',
        message: `Error retrieving services: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findOne(id: number) {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id },
        include: {
          appointment: true,
          payment: true
        }
      });

      if (!service) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: "Service retrieved successfully",
        data: service
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOne',
        message: `Error retrieving service: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findByProfessionalId(profissionalId: number) {
    try {
      const services = await this.prismaService.service.findMany({
        where: { profissionalId },
        include: {
          profissional: true,
          appointment: true,
          payment: true
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Services retrieved successfully",
        data: services
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findByProfessionalId',
        message: `Error retrieving services: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async update(id: number, updateServicesScheduleDto: ServicesScheduleDto) {
    try {
      const existingService = await this.prismaService.service.findUnique({
        where: { id }
      });

      if (!existingService) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      const service = await this.prismaService.service.update({
        where: { id },
        data: updateServicesScheduleDto
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Service updated successfully",
        data: service
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'update',
        message: `Error updating service: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async remove(id: number) {
    try {
      const existingService = await this.prismaService.service.findUnique({
        where: { id }
      });

      if (!existingService) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      await this.prismaService.service.delete({
        where: { id }
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Service deleted successfully"
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Error deleting service: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  // Appointment CRUD
  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    try {
      // Verificar se o serviço existe
      const service = await this.prismaService.service.findUnique({
        where: { id: createAppointmentDto.serviceId }
      });

      if (!service) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      // Verificar se o profissional existe
      const professional = await this.prismaService.professional.findUnique({
        where: { id: createAppointmentDto.professionalId }
      });

      if (!professional) {
        throw new HttpException('Professional not found', HttpStatus.NOT_FOUND);
      }

      // Verificar disponibilidade do horário
      const existingAppointment = await this.prismaService.appointment.findFirst({
        where: {
          AND: [
            { professionalId: createAppointmentDto.professionalId },
            { date: createAppointmentDto.date },
            { status: { not: ServiceStatus.CANCELED } }
          ]
        }
      });

      if (existingAppointment) {
        throw new HttpException('This time slot is already booked', HttpStatus.CONFLICT);
      }

      const appointment = await this.prismaService.appointment.create({
        data: {
          ...createAppointmentDto,
          status: ServiceStatus.PENDING
        }
      });

      // Enviar email de confirmação
      await this.mailerService.sendEmailConfirmRegister(appointment.fanId, Role.CLIENT);

      return {
        statusCode: HttpStatus.CREATED,
        message: "Appointment created successfully",
        data: appointment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createAppointment',
        message: `Error creating appointment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findAllAppointments() {
    try {
      const appointments = await this.prismaService.appointment.findMany({
        include: {
          service: true
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: "Appointments retrieved successfully",
        data: appointments
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAllAppointments',
        message: `Error retrieving appointments: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findOneAppointment(id: number) {
    try {
      const appointment = await this.prismaService.appointment.findUnique({
        where: { id },
        include: {
          service: true
        }
      });

      if (!appointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: "Appointment retrieved successfully",
        data: appointment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOneAppointment',
        message: `Error retrieving appointment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async updateAppointment(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    try {
      const existingAppointment = await this.prismaService.appointment.findUnique({
        where: { id }
      });

      if (!existingAppointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      const appointment = await this.prismaService.appointment.update({
        where: { id },
        data: updateAppointmentDto
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Appointment updated successfully",
        data: appointment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'updateAppointment',
        message: `Error updating appointment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async cancelAppointment(id: number) {
    try {
      const existingAppointment = await this.prismaService.appointment.findUnique({
        where: { id }
      });

      if (!existingAppointment) {
        throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
      }

      const appointment = await this.prismaService.appointment.update({
        where: { id },
        data: {
          status: ServiceStatus.CANCELED
        }
      });

      return {
        statusCode: HttpStatus.OK,
        message: "Appointment canceled successfully",
        data: appointment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'cancelAppointment',
        message: `Error canceling appointment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  // Payment CRUD
  async createPayment(createPaymentDto: CreatePaymentDto) {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id: createPaymentDto.serviceId }
      });

      if (!service) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      const payment = await this.prismaService.payment.create({
        data: createPaymentDto
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: "Payment created successfully",
        data: payment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'createPayment',
        message: `Error creating payment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findAllPayments() {
    try {
      const payments = await this.prismaService.payment.findMany({
        include: {
          Service: true
        }
      });
      return {
        statusCode: HttpStatus.OK,
        message: "Payments retrieved successfully",
        data: payments
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAllPayments',
        message: `Error retrieving payments: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async findOnePayment(id: number) {
    try {
      const payment = await this.prismaService.payment.findUnique({
        where: { id },
        include: {
          Service: true
        }
      });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      return {
        statusCode: HttpStatus.OK,
        message: "Payment retrieved successfully",
        data: payment
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOnePayment',
        message: `Error retrieving payment: ${error.message}`
      });
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }
  }
}