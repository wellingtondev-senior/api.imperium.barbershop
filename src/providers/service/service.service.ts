import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomService } from '../../modulos/logger/logger.service';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class ServiceService {
  private readonly className: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly loggerService: LoggerCustomService,
  ) {
    this.className = this.constructor.name;
  }

  async create(data: ServiceDto) {
    try {
      const service = await this.prismaService.service.create({
        data: {
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          imageUrl: data.imageUrl,
          active: data.active ?? true,
          professionalId: data.professionalId,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'create',
        message: `Created service with ID: ${service.id}`,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: service,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'create',
        message: `Error creating service: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const services = await this.prismaService.service.findMany({
        include: {
          professional: true,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: services,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findAll',
        message: `Error finding services: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id },
        include: {
          professional: true,
        },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      return {
        statusCode: HttpStatus.OK,
        message: service,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findOne',
        message: `Error finding service: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async findByProfessional(professionalId: number) {
    try {
      const services = await this.prismaService.service.findMany({
        where: { professionalId },
        include: {
          professional: true,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: services,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'findByProfessional',
        message: `Error finding services by professional: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, data: Partial<ServiceDto>) {
    try {
      const service = await this.prismaService.service.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          imageUrl: data.imageUrl,
          active: data.active,
          professionalId: data.professionalId,
        },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'update',
        message: `Updated service with ID: ${service.id}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: service,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'update',
        message: `Error updating service: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: number) {
    try {
      // Verificar se existem agendamentos ativos
      const hasActiveSchedules = await this.prismaService.schedule.findFirst({
        where: {
           id,
          status: {
            in: ['pending', 'confirmed'],
          },
        },
      });

      if (hasActiveSchedules) {
        // Em vez de excluir, apenas desativar o serviço
        const service = await this.prismaService.service.update({
          where: { id },
          data: { active: false },
        });

        this.loggerService.log({
          className: this.className,
          functionName: 'remove',
          message: `Service with ID ${id} marked as inactive due to existing schedules`,
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Service marked as inactive due to existing schedules',
          service,
        };
      }

      const service = await this.prismaService.service.delete({
        where: { id },
      });

      this.loggerService.log({
        className: this.className,
        functionName: 'remove',
        message: `Deleted service with ID: ${service.id}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: service,
      };
    } catch (error) {
      this.loggerService.error({
        className: this.className,
        functionName: 'remove',
        message: `Error deleting service: ${error.message}`,
      });
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findSchedulesByServiceId(id: number) {
    try {
      const schedules = await this.prismaService.schedule.findMany({
        where: {
          services: {
            some: {
              id
            }
          }
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
        data: schedules
      };
    } catch (error) {
      throw new Error(`Erro ao buscar agendamentos do serviço: ${error.message}`);
    }
  }
}
