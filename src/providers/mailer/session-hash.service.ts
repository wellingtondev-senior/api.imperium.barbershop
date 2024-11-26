import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionHashService {
  async generateHash(email: string) {
    const hash = randomBytes(32).toString('hex');
    const codigo = Math.floor(100000 + Math.random() * 900000);
    
    return {
      hash,
      codigo,
    };
  }
}
