import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { ClientInfoDto } from './dto/create-client.dto';
import { SessionHashService } from '../session-hash/session-hash.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionHashService: SessionHashService,
    private readonly mailerService: MailerService,
  ) {}

  async create(createClientDto: ClientInfoDto) {
    return this.prisma.client.create({
      data: createClientDto
    });
  }
}
