export type Raw<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const toRaws = <T extends object>(obj: T): Partial<Raw<T>> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key as keyof T];
    if (value !== undefined && value !== null && typeof value !== 'function') {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
};
