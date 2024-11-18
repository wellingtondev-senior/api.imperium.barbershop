import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/enums/role.enum';
import { ROLES_KEY } from 'src/decorator/roles.decorator';
import { jwtConstants } from 'src/config/jwt';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authorization = request.headers.authorization;

      if (!authorization) {
        throw new UnauthorizedException('Formato Header estar incorreto');
      }

      const token = authorization.replace("Bearer ", "").trim();
      const verifiedToken = await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret });

      if (!verifiedToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!requiredRoles) {
        return true; // No roles required, grant access
      }

      const decode = this.jwtService.decode(token) as { role: Role };
      if (!decode || !decode.role) {
        throw new UnauthorizedException('Token payload error');
      }

      const userRole = decode.role;
      if (!requiredRoles.includes(userRole)) {
        throw new UnauthorizedException('Permissão negada');
      }

      return true;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }
}
