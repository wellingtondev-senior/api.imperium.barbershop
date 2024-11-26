import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerCustomModule } from '../logger/logger.module';
import { CredenciaisService } from './credenciais.service';

@Module({
  imports: [PrismaModule, LoggerCustomModule],
  providers: [CredenciaisService],
  exports: [CredenciaisService],
})
export class CredenciaisModule {}
