import { InjectQueue } from '@nestjs/bull';
import { Injectable, } from '@nestjs/common';
import { Queue } from 'bull';



@Injectable()
export class ControlAppProducerService {

   constructor(
      @InjectQueue('control-app-queue') private controlAppQueue: Queue
   ) {
   }

   async CreateApp(payload: any) {
      await this.controlAppQueue.add('criar_app_job', payload, { removeOnComplete: true });
   }

}

