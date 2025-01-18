import { Injectable } from '@nestjs/common';
import { CreateNotificationDto, UpdateNotificationDto } from './notification.dto';
import { PrismaService } from 'src/modulos/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateNotificationDto) {
    return this.prisma.notifications.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'pending',
        professional: {
          connect: { id: data.professionalId }
        },
        client: {
          connect: { id: data.clientId }
        }
      },
      include: {
        professional: true,
        client: true
      }
    });
  }

  async findAll() {
    return this.prisma.notifications.findMany({
      include: {
        professional: true,
        client: true
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.notifications.findUnique({
      where: { id },
      include: {
        professional: true,
        client: true
      }
    });
  }

  async update(id: number, data: UpdateNotificationDto) {
    return this.prisma.notifications.update({
      where: { id },
      data,
      include: {
        professional: true,
        client: true
      }
    });
  }

  async remove(id: number) {
    return this.prisma.notifications.delete({
      where: { id }
    });
  }

  async findByProfessional(professionalId: number) {
    return this.prisma.notifications.findMany({
      where: { professionalId },
      include: {
        professional: true,
        client: true
      }
    });
  }

  async findByClient(clientId: number) {
    return this.prisma.notifications.findMany({
      where: { clientId },
      include: {
        professional: true,
        client: true
      }
    });
  }
}
