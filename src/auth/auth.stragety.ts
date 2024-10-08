import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService, DecodedJwt, EncodedJwt } from './auth.service';
import { readJwtSecret } from './auth.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: readJwtSecret(configService),
    });
  }

  async validate(payload: EncodedJwt): Promise<DecodedJwt> {
    return {
      credentials: this.authService.decryptCredentials(payload.credentials),
      userId: parseInt(payload.userId),
      username: payload.username,
      level: payload.level,
    };
  }
}
