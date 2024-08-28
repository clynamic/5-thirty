import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { AppConfigKeys } from 'src/app';

import { encodeCredentials } from './auth.utils';

@Injectable()
export class AxiosAuthService {
  constructor(private readonly configService: ConfigService) {}

  public getGlobalConfig(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: encodeCredentials({
          username: this.configService.getOrThrow(
            AppConfigKeys.E621_GLOBAL_USERNAME,
          ),
          password: this.configService.getOrThrow(
            AppConfigKeys.E621_GLOBAL_API_KEY,
          ),
        }),
      },
    };
  }
}
