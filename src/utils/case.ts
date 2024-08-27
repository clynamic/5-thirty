function toCamelCase(snakeCaseString: string): string {
  return snakeCaseString.replace(/_([a-z])/g, (_, letter) =>
    letter.toUpperCase(),
  );
}

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type ConvertKeysToCamelCase<T> = {
  [K in keyof T as SnakeToCamelCase<string & K>]: T[K];
};

export function convertKeysToCamelCase<T extends Record<string, any>>(
  obj: T,
): ConvertKeysToCamelCase<T> {
  const newObj: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelCaseKey = toCamelCase(key);
      newObj[camelCaseKey] = obj[key];
    }
  }

  return newObj as ConvertKeysToCamelCase<T>;
}
