import { AxiosError, AxiosResponse } from 'axios';

interface EmptyResultsError {
  success: false;
  message: string;
  code: string;
}

/**
 * Temporary fix for certain endpoints, where an empty result causes a 500.
 */
export const emptyResultsErrorInterceptor = (error: AxiosError): never => {
  if (
    error.response?.status === 500 &&
    error.response?.data &&
    typeof error.response.data === 'object'
  ) {
    const errorData = error.response.data as EmptyResultsError;

    if (
      errorData.success === false &&
      errorData.message?.includes('Cannot infer root key from collection type')
    ) {
      const emptyResponse: AxiosResponse = {
        ...error.response,
        status: 200,
        statusText: 'OK',
        data: [],
      };

      return Promise.resolve(emptyResponse) as never;
    }
  }

  throw error;
};
