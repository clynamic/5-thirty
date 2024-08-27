import axios from 'axios';

import { user } from '../e621';
import { AXIOS_INSTANCE } from '../http';

export interface UserCredentials {
  username: string;
  password: string;
}

export const checkCredentials = async (
  credentials: UserCredentials,
): Promise<boolean> => {
  setAxiosAuth(credentials);

  try {
    await user(credentials.username);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return false;
    }
    throw error;
  } finally {
    clearAxiosAuth();
  }
};

export const setAxiosAuth = (credentials: UserCredentials) => {
  AXIOS_INSTANCE.defaults.headers.common['Authorization'] =
    `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
};

export const clearAxiosAuth = () => {
  AXIOS_INSTANCE.defaults.headers.common['Authorization'] = undefined;
};
