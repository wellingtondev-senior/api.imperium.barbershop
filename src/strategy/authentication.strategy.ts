import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../providers/auth/auth.service";


@Injectable()
export class AuthenticationStrategy extends PassportStrategy(Strategy) {

  constructor(
    private authService: AuthService
    ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const validade = true//await this.authService.validate(email, password);
    if (!validade) {
      throw new HttpException(`Erro ao criar novo cadastro de usuario`, HttpStatus.BAD_REQUEST);
    } else {
      return validade; 

    }
  }
}
