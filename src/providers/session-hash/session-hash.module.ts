import { Module } from '@nestjs/common';
import { SessionHashService } from './session-hash.service';
import { SessionHashController } from './session-hash.controller';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    LoggerCustomModule,
    JwtModule,
  ],
  controllers: [SessionHashController],
  providers: [SessionHashService],
  exports: [SessionHashService],
})
export class SessionHashModule {}
