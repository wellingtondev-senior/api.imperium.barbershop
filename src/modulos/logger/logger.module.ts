import {  Module } from '@nestjs/common';
import { LoggerCustomService } from './logger.service';

@Module({
    imports: [
    ],
    controllers: [],
    providers: [
        LoggerCustomService,
    ],
    exports: [
        LoggerCustomService
    ]
})
export class LoggerCustomModule { }
