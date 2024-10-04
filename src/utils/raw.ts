import { FindOptionsWhere } from 'typeorm';

export type Raw<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const toWhere = <T extends object, R extends Raw<T>>(
  raw?: T,
): FindOptionsWhere<R> => {
  const result: FindOptionsWhere<R> = {};

  for (const key in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      const value = raw[key];

      if (value !== undefined && typeof value !== 'function') {
        (result as any)[key] = value;
      }
    }
  }

  return result;
};
