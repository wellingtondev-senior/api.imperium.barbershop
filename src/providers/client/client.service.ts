import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import { ClientScheduleDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createClientDto: ClientScheduleDto) {
    return this.prisma.client.create({
      data: createClientDto
    });
  }
}
