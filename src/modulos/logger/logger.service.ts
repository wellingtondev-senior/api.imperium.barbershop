import { Injectable, Scope, ConsoleLogger, LoggerService } from '@nestjs/common';

type LogParamsType = {
    className: string,
    functionName: string,
    message: string
}



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