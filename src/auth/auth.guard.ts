import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import _ from 'lodash';

import { getUserLevelFromString, UserLevel } from './auth.level';
import { DecodedJwt } from './auth.service';
import { readServerAdminCredentials } from './auth.utils';

export const AuthLevel = (level: UserLevel) => SetMetadata('level', level);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard extends JwtAuthGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) return false;

    const requiredLevel = this.reflector.get<UserLevel>(
      'level',
      context.getHandler(),
    );
    if (requiredLevel === undefined) {
      return true;
    }

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
  constructor(private configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) return false;

    const serverAdminCredentials = readServerAdminCredentials(
      this.configService,
    );

    const user = context.switchToHttp().getRequest().user as DecodedJwt;

    if (_.isEqual(user.credentials, serverAdminCredentials)) {
      return true;
    } else {
      throw new ForbiddenException('Insufficient level');
    }
  }
}
