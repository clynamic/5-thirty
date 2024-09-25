import { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';

const deserializeDates = <T>(body: T): T => {
  if (body === null || (typeof body !== 'object' && typeof body !== 'string'))
    return body;

  if (typeof body === 'string') {
    const date = DateTime.fromISO(body);
    if (date.isValid) return date.toJSDate() as unknown as T;
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
 * Deserialize dates from string to Date.
 * Dates are expected to be in the format 'yyyy-MM-dd' or 'yyyy-MM-ddTHH:mm:ss.sssZ'.
 */
export const dateDeserializeInterceptor = (
  response: AxiosResponse,
): AxiosResponse => ({
  ...response,
  data: deserializeDates(response.data),
});
