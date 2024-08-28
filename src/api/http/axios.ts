import { Logger } from '@nestjs/common';
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

import pack from '../../../package.json';
import { dateDeserializeInterceptor } from './date';
import { miscFixInterceptors } from './misc';
import { objectUnpackInterceptor } from './unpack';

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
  const url = new URL(config.url ?? '', config.baseURL);

  if (config.params) {
    const searchParams = new URLSearchParams(config.params);
    url.search = searchParams.toString();
  }

  const fullUrl = url.href;
  logger.log(`[${config.method?.toUpperCase() ?? '???'}] -> ${fullUrl}`);
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    const { config, status } = response;
    const url = new URL(config.url ?? '', config.baseURL);
    logger.log(
      `[${config.method?.toUpperCase() ?? '???'}] <- ${url.href} : ${status}`,
    );
    return response;
  },
  (error) => {
    if (error instanceof AxiosError && error.response) {
      const { config, status } = error.response;
      const url = new URL(config.url ?? '', config.baseURL);
      logger.log(
        `[${config.method?.toUpperCase() ?? '???'}] <- ${url.href} : ${status}`,
      );
    } else {
      logger.log(`Error: ${error.message}`);
    }
    return Promise.reject(error);
  },
);

export const makeRequest = <T>(
  config: AxiosRequestConfig,
  requestConfig?: AxiosRequestConfig,
): Promise<T> =>
  AXIOS_INSTANCE.request<T>({
    ...config,
    ...requestConfig,
  }).then((response) => response.data);

export type ErrorType<Error> = AxiosError<Error>;
