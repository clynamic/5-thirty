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

export const toRawQuery = <T extends object>(obj?: T): string => {
  if (!obj || Object.keys(obj).length === 0) {
    return '';
  }
  const raw = toRaws(obj);
  return Object.keys(raw)
    .map((key) => {
      const value = raw[key as keyof typeof raw];
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join('&');
      }
      return `${key}=${encodeURIComponent(String(value))}`;
    })
    .filter(Boolean)
    .join('&');
};

export const toRawUrl = (...args: any[]): string => {
  const pathSegments: string[] = [];
  const queryParams: Record<string, unknown> = {};

  args.forEach((arg) => {
    if (arg === undefined || arg === null) {
      return;
    }

    if (typeof arg !== 'object' || Array.isArray(arg)) {
      pathSegments.push(encodeURIComponent(String(arg)));
    } else {
      Object.assign(queryParams, arg);
    }
  });

  const path = pathSegments.join('/');
  const query = toRawQuery(queryParams);

  if (pathSegments.length > 0) {
    return query ? `/${path}?${query}` : `/${path}`;
  } else {
    return query ? `?${query}` : '';
  }
};
