import { BadRequestException } from '@nestjs/common';
import { DateTime, DateTimeUnit } from 'luxon';

import { SeriesCountPoint } from './chart.dto';
import { DateRange, PartialDateRange, TimeScale } from './date-range.dto';

export interface SeriesPoint<T> {
  date: Date;
  value: T;
}

const formatTimeBucket = (date: DateTime, bucket: TimeScale): number => {
  if (bucket === TimeScale.All) {
    return 0;
  } else if (bucket === TimeScale.Decade) {
    const startOfDecade = date
      .set({ year: Math.floor(date.year / 10) * 10 })
      .startOf('year');
    return startOfDecade.toSeconds();
  } else {
    const startOfBucket = date.startOf(bucket.toLowerCase() as DateTimeUnit);
    return startOfBucket.toSeconds();
  }
};

const parseTimeBucket = (
  seconds: number,
  bucket: TimeScale,
  timezone: string,
): DateTime => {
  const date = DateTime.fromSeconds(seconds, { zone: timezone });

  if (bucket === TimeScale.All) {
    return DateTime.fromObject({ year: 0 }, { zone: timezone });
  } else if (bucket === TimeScale.Decade) {
    const decadeStartYear = Math.floor(date.year / 10) * 10;
    return DateTime.fromObject({ year: decadeStartYear }, { zone: timezone });
  } else {
    return date.startOf(bucket.toLowerCase() as DateTimeUnit);
  }
};

const incrementTimeBucket = (date: DateTime, bucket: TimeScale): DateTime => {
  if (bucket === TimeScale.All) {
    return date.plus({ years: 9999 });
  } else if (bucket === TimeScale.Decade) {
    return date.plus({ years: 10 });
  } else {
    return date.plus({ [bucket]: 1 });
  }
};

export const createTimeBuckets = (
  start: DateTime,
  end: DateTime,
  bucket: TimeScale,
): DateTime[] => {
  const buckets = [];
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = incrementTimeBucket(currentDate, bucket)
  ) {
    buckets.push(currentDate);
  }
  return buckets;
};

const MAX_BUCKET_COUNT = 10000;

export const generateSeriesPoints = <T, R>(
  items: T[],
  dates: readonly (Date | DateRange | undefined)[],
  range: PartialDateRange,
  getValue: (prev: R | undefined, item: T) => R,
  getDefault: (seconds: number) => R,
): SeriesPoint<R>[] => {
  const dateRange = DateRange.fill(range);
  const counts: Record<number, R> = {};

  const buckets = createTimeBuckets(
    DateTime.fromJSDate(dateRange.startDate, { zone: dateRange.timezone }),
    DateTime.min(
      DateTime.fromJSDate(dateRange.endDate, { zone: dateRange.timezone }),
      DateTime.now().setZone(dateRange.timezone).endOf('day'),
    ),
    dateRange.scale,
  );

  if (buckets.length >= MAX_BUCKET_COUNT) {
    throw new BadRequestException(
      `Your request results in too many data points (${buckets.length}/${MAX_BUCKET_COUNT}). ` +
        `Please select a smaller range or larger bucket size.`,
    );
  }

  for (const item of items) {
    const keys = dates[items.indexOf(item)];
    let datetimes: DateTime[] = [];

    if (keys && 'startDate' in keys && 'endDate' in keys) {
      const unit: DateTimeUnit =
        range.scale! === 'minute' || range.scale! === 'hour'
          ? range.scale!
          : 'day';

      datetimes = createTimeBuckets(
        DateTime.fromJSDate(keys.startDate, {
          zone: dateRange.timezone,
        }).startOf(unit),
        DateTime.min(DateTime.fromJSDate(keys.endDate), DateTime.now())
          .setZone(dateRange.timezone)
          .endOf(unit),
        dateRange.scale,
      );
    } else if (keys instanceof Date) {
      datetimes = [DateTime.fromJSDate(keys, { zone: dateRange.timezone })];
    }

    for (const date of datetimes) {
      const dateInZone = date.setZone(range.timezone);
      const unix = formatTimeBucket(dateInZone, dateRange.scale);
      counts[unix] = getValue(counts[unix], item);
    }
  }

  for (const currentDate of buckets) {
    const unix = formatTimeBucket(currentDate, range.scale!);
    if (!(unix in counts)) {
      counts[unix] = getDefault(unix);
    }
  }

  return Object.keys(counts)
    .map((seconds) => ({
      date: parseInt(seconds),
      value: counts[parseInt(seconds)]!,
    }))
    .sort((a, b) => a.date - b.date)
    .map(({ date, value }) => ({
      date: parseTimeBucket(
        date,
        dateRange.scale,
        dateRange.timezone,
      ).toJSDate(),
      value,
    }));
};

export const generateSeriesCountPoints = (
  dates: readonly (Date | DateRange | undefined)[],
  range: PartialDateRange,
): SeriesCountPoint[] =>
  generateSeriesPoints(
    Array.from({ length: dates.length }, (_, i) => i),
    dates,
    range,
    (prev) => (prev ?? 0) + 1,
    () => 0,
  ).map((e) => new SeriesCountPoint(e));

export const generateSeriesRecordPoints = <R extends Record<string, number>>(
  dates: readonly (Date | DateRange | undefined)[],
  keys: readonly (keyof R)[],
  allKeys: readonly (keyof R)[],
  range: PartialDateRange,
): SeriesPoint<R>[] => {
  const getDefault = () => {
    const emptyRecord: Partial<R> = {};
    for (const key of allKeys) {
      emptyRecord[key] = 0 as R[keyof R];
    }
    return emptyRecord as R;
  };
  return generateSeriesPoints(
    Array.from({ length: dates.length }, (_, i) => i),
    dates,
    range,
    (prev, item) => {
      const key = keys[item]!;
      return {
        ...(prev ?? getDefault()),
        [key]: (prev?.[key] ?? 0) + 1,
      } as R;
    },
    getDefault,
  );
};
