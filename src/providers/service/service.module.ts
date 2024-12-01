import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { PrismaService } from '../../modulos/prisma/prisma.service';
import { LoggerCustomModule } from '../../modulos/logger/logger.module';

@Module({
  imports: [LoggerCustomModule],
  controllers: [ServiceController],
  providers: [ServiceService, PrismaService],
  exports: [ServiceService],
})
export class ServiceModule {}
