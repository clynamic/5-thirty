import { AxiosResponse } from 'axios';
import { isValid, parseISO } from 'date-fns';

const deserializeDates = <T>(body: T): T => {
  if (body === null || (typeof body !== 'object' && typeof body !== 'string')) {
    return body;
  }

  if (typeof body === 'string') {
    const date = parseISO(body);
    if (isValid(date)) return date as unknown as T;
    return body;
  }

  if (Array.isArray(body)) return body.map(deserializeDates) as unknown as T;

  for (const key of Object.keys(body)) {
    body[key as keyof typeof body] = deserializeDates(
      body[key as keyof typeof body],
    );
  }

  return body;
};

/**
 * Deserialize dates from string to Date, but only if the response is JSON.
 */
export const dateDeserializeInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  if (!response.headers['content-type']?.includes('application/json')) {
    return response;
  }

  return {
    ...response,
    data: deserializeDates(response.data),
  };
};
