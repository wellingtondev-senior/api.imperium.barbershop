import { CredenciaisController } from './credencias.controller';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/modulos/prisma/prisma.module';
import { LoggerCustomModule } from 'src/modulos/logger/logger.module';
import { CredenciaisService } from './credencias.service';

@Module({
    imports: [
        PrismaModule,
        LoggerCustomModule,
    ],
    controllers: [
        CredenciaisController,
    ]
        ,
    providers: [
        CredenciaisService
    ],
    exports:[
        CredenciaisService
    ]
})
export class CredenciaisModule { }
