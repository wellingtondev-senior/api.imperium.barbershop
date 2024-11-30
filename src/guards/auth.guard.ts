import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CredenciaisService } from 'src/modulos/credenciais/credenciais.service';

@Injectable()
export class AuthGuard  implements CanActivate  {

  constructor(private credenciaisService: CredenciaisService) {}

    async canActivate(context: ExecutionContext): Promise<boolean | any> {
        const request: any = context.switchToHttp().getRequest();
        const response: any = context.switchToHttp().getResponse();
        const {email, password} = request.body
        const validade = await this.credenciaisService.validateCredenciais(email, password);
        return validade;
        
      }
 }
