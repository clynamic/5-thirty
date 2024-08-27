import { AxiosResponse } from 'axios';

export const miscFixInterceptors = (response: AxiosResponse): AxiosResponse => {
  // e621 is genuinely such a deranged site
  if (response.data && response.data.post) {
    response.data = response.data.post;
  }
  return response;
};
