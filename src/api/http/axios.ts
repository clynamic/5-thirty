import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

import pack from '../../../package.json';
import {
  dateDeserializeInterceptor,
  timezoneInjectorInterceptor,
} from './date';
import {
  logErrorInterceptor,
  logRequestInterceptor,
  logResponseInterceptor,
} from './logs';
import { miscFixInterceptors } from './misc';
import { objectUnpackInterceptor } from './unpack';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: 'https://e621.net',
  headers: {
    'User-Agent': `${pack.name}/${pack.version} (${pack.author})`,
  },
});

AXIOS_INSTANCE.interceptors.request.use(logRequestInterceptor);

AXIOS_INSTANCE.interceptors.request.use(timezoneInjectorInterceptor);

AXIOS_INSTANCE.interceptors.response.use(dateDeserializeInterceptor);
AXIOS_INSTANCE.interceptors.response.use(objectUnpackInterceptor);
AXIOS_INSTANCE.interceptors.response.use(miscFixInterceptors);

AXIOS_INSTANCE.interceptors.response.use(
  logResponseInterceptor,
  logErrorInterceptor,
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
