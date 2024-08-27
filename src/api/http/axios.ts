import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { dateDeserializeInterceptor } from './date';
import { miscFixInterceptors } from './misc';
import { objectUnpackInterceptor } from './unpack';

import pack from '../../../package.json';
import { Logger } from '@nestjs/common';

const logger = new Logger('Axios');

export const AXIOS_INSTANCE = Axios.create({
  baseURL: 'https://e621.net',
  headers: {
    'User-Agent': `${pack.name}/${pack.version} (${pack.author})`,
  },
});

AXIOS_INSTANCE.interceptors.response.use(dateDeserializeInterceptor);
AXIOS_INSTANCE.interceptors.response.use(objectUnpackInterceptor);
AXIOS_INSTANCE.interceptors.response.use(miscFixInterceptors);

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const url = new URL(config.url, config.baseURL);

  if (config.params) {
    const searchParams = new URLSearchParams(config.params);
    url.search = searchParams.toString();
  }

  const fullUrl = url.href;
  logger.log(`[${config.method}] -> ${fullUrl}`);
  return config;
});

export const makeRequest = <T>(
  config: AxiosRequestConfig,
  requestConfig?: AxiosRequestConfig,
): Promise<T> =>
  AXIOS_INSTANCE.request<T>({
    ...config,
    ...requestConfig,
  }).then((response) => response.data);

export type ErrorType<Error> = AxiosError<Error>;
