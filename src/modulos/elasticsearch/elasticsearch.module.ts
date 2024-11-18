import { LoggerCustomModule } from '../logger/logger.module';
import { ElasticsearchService } from './elasticsearch.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        LoggerCustomModule
    ],
    providers: [
        ElasticsearchService,
    ],
        exports:[
            ElasticsearchService,
        ],
})
export class ElasticsearchModule { }
