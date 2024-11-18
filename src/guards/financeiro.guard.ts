import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/config/jwt';

@Injectable()
export class FinanceiroGuard implements CanActivate {


  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) { }


  async canActivate(context: ExecutionContext): Promise<boolean | any> {
    try {
      const { authorization } = context.switchToHttp().getRequest().headers;
      if (authorization) {
        const tokenHeader = authorization?.replace("Bearer ", "").trim();
        const vereficToken = await this.jwtService.verifyAsync(tokenHeader, {
          secret: jwtConstants.secret
        })
        console.log(vereficToken)
        return true
      }
      return true

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_ACCEPTABLE);
    }




  }



}
