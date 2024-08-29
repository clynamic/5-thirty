import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';

import { encodeCredentials, readServerAdminCredentials } from './auth.utils';

@Injectable()
export class AxiosAuthService {
  constructor(private readonly configService: ConfigService) {}

  public getGlobalConfig(): AxiosRequestConfig {
    return {
      headers: {
        Authorization: encodeCredentials(
          readServerAdminCredentials(this.configService),
        ),
      },
    };
  }
}
