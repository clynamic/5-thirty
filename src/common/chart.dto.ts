export interface SeriesPoint<T> {
  date: Date;
  value: T;
}

export class SeriesCountPoint implements SeriesPoint<number> {
  constructor(value: SeriesCountPoint) {
    Object.assign(this, value);
  }

  date: Date;
  value: number;
}
