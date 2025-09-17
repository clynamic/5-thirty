import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { UserLevel, getUserLevelFromString } from './auth.level';
import { AuthService, DecodedJwt } from './auth.service';

export const AuthLevel = (level: UserLevel) => SetMetadata('level', level);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest(_: any, user: any) {
    return user;
  }
}

@Injectable()
export class RolesGuard extends JwtAuthGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) return false;

    const requiredLevel =
      this.reflector.get<UserLevel>('level', context.getHandler()) ||
      this.reflector.get<UserLevel>('level', context.getClass());

    if (requiredLevel === undefined) return true;

    const user = context.switchToHttp().getRequest().user as DecodedJwt;
    const level = getUserLevelFromString(user.level);

    if (!level || level === undefined || level < requiredLevel) {
      throw new ForbiddenException('Insufficient level');
    }

    return true;
  }
}

@Injectable()
export class ServerAdminGuard extends JwtAuthGuard {
  constructor(private authService: AuthService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) return false;

    const user = context.switchToHttp().getRequest().user as DecodedJwt;

    if (this.authService.isServerAdmin(user)) {
      return true;
    } else {
      throw new ForbiddenException('Insufficient level');
    }
  }
}
