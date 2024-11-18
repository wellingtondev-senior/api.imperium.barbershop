import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from "../providers/auth/auth.service";

@Injectable()
export class AuthGuard  implements CanActivate  {

  constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean | any> {
        const request: any = context.switchToHttp().getRequest();
        const response: any = context.switchToHttp().getResponse();
        const {email, password} = request.body
        const validade = await this.authService.validate(email, password);
        return validade;
        
      }
 }
