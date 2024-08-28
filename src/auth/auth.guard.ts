import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { getUserLevelFromString, UserLevel } from './auth.level';

export const AuthLevel = (level: UserLevel) => SetMetadata('level', level);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isJwtValid = await this.jwtAuthGuard.canActivate(context);
    if (!isJwtValid) {
      return false;
    }

    const requiredLevel = this.reflector.get<UserLevel>(
      'level',
      context.getHandler(),
    );
    if (requiredLevel === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const level = getUserLevelFromString(user.level);

    if (!level || level === undefined || level < requiredLevel) {
      throw new ForbiddenException('Insufficient level');
    }

    return true;
  }
}
