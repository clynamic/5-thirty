export class SeriesCountPoint {
  constructor(value: SeriesCountPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}
