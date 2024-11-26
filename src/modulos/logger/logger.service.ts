import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';
import { LogParamsType } from 'src/types/log.params';




@Injectable({ scope: Scope.TRANSIENT })
export class LoggerCustomService extends ConsoleLogger {

    constructor(
    ) {
        super();
    }

    warn({ className, functionName, message }: LogParamsType){
        super.warn(`[${className}/${functionName}]: ${message}`);
    }
    

    log({ className, functionName, message }: LogParamsType) {

        super.log(`[${className}/${functionName}]: ${message}`);
    }
    error({ className, functionName, message }: LogParamsType) {
        super.error(`[${className}/${functionName}]: ${message}`);

    }

    
}