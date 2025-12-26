import { Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const logger = new Logger('Axios');

export const logRequestInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const url = new URL(config.url ?? '', config.baseURL);

  if (config.params) {
    const searchParams = new URLSearchParams(config.params);
    url.search = searchParams.toString();
  }

  logger.log(`[${config.method?.toUpperCase() ?? '???'}] -> ${url.href}`);
  return config;
};

export const logResponseInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  const { config, status } = response;
  const url = new URL(config.url ?? '', config.baseURL);

  if (config.params) {
    const searchParams = new URLSearchParams(config.params);
    url.search = searchParams.toString();
  }

  logger.log(
    `[${config.method?.toUpperCase() ?? '???'}] <- ${url.href} : ${status}`,
  );
  return response;
};

export const logErrorInterceptor = (error: AxiosError) => {
  if (error instanceof AxiosError && error.response) {
    const { config, status } = error.response;
    const url = new URL(config.url ?? '', config.baseURL);

    if (config.params) {
      const searchParams = new URLSearchParams(config.params);
      url.search = searchParams.toString();
    }

    logger.log(
      `[${config.method?.toUpperCase() ?? '???'}] <- ${url.href} : ${status}`,
    );
  } else if (error instanceof AxiosError && error.config) {
    const { config } = error;
    const url = new URL(config.url ?? '', config.baseURL);

    if (config.params) {
      const searchParams = new URLSearchParams(config.params);
      url.search = searchParams.toString();
    }

    const status = error.code || 'UNKNOWN';
    logger.error(
      `[${config.method?.toUpperCase() ?? '???'}] x- ${url.href} : ${status}`,
    );
  } else {
    logger.error(`Request failed: ${error.message}`);
  }
  return Promise.reject(error);
};
