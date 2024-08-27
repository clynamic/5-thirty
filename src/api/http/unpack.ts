import { AxiosResponse } from 'axios';

export const objectUnpackInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  // if we receive an object with a single key that is an array, unpack it as just the array
  // this helps us overcome a silly API design choice
  // no types need to be changed as our docs just assume an array
  if (typeof response.data === 'object' && response.data !== null) {
    const keys = Object.keys(response.data);
    if (keys.length === 1 && Array.isArray(response.data[keys[0]])) {
      return { ...response, data: response.data[keys[0]] };
    }
  }
  return response;
};
