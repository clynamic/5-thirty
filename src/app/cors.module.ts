import { Global, MethodNotAllowedException, Module } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

import { AppConfigKeys } from './config.module';

@Global()
@Module({})
export class CorsConfigModule {
  constructor(private readonly configService: ConfigService) {}

  public createCorsOptions(): CorsOptions {
    const allowedOrigins = this.configService.get<string | string[]>(
      AppConfigKeys.CORS_ALLOWED_ORIGINS,
    );

    const regexes = [
      /^(https?:\/\/)?(localhost)(:\d+)?(\/.*)?$/,
      /^(https?:\/\/)?(127\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/,
      /^(https?:\/\/)?(0:0:0:0:0:0:0:1)(:\d+)?(\/.*)?$/,
    ];

    const origins = Array.isArray(allowedOrigins)
      ? allowedOrigins
      : allowedOrigins?.split(',');

    return {
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      origin: (origin, callback) => {
        if (
          !origin ||
          regexes.some((regex) => regex.test(origin)) ||
          origins?.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(new MethodNotAllowedException('Origin not allowed'), false);
        }
      },
      credentials: true,
    };
  }
}
