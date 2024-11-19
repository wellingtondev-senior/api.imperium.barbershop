import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { ServicesScheduleDto } from './dto/services-schedule.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';
import { LoggerCustomService } from 'src/modulos/logger/logger.service';
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
      const services = await this.prismaService.service.findMany();
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
        where: { id }
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
}