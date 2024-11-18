import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { TronwebService } from './tronweb.service';
import { Module } from '@nestjs/common';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        PrismaModule,
        LoggerCustomModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    providers: [
        TronwebService,
    ],
    exports: [
        TronwebService,
    ],
})
export class TronwebModule { }
