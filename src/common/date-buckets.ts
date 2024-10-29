import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { SeriesCountPoint } from './chart.dto';
import { DateRange, PartialDateRange, TimeScale } from './date-range.dto';

export interface SeriesPoint<T> {
  date: Date;
  value: T;
}

const timeBucketFormats = {
  [TimeScale.Minute]: 'yyyy-MM-dd HH:mm',
  [TimeScale.Hour]: 'yyyy-MM-dd HH',
  [TimeScale.Day]: 'yyyy-MM-dd',
  [TimeScale.Week]: "kkkk-'W'WW",
  [TimeScale.Month]: 'yyyy-MM',
  [TimeScale.Year]: 'yyyy',
  [TimeScale.Decade]: 'yyyy',
  [TimeScale.All]: 'all',
};

const formatTimeBucket = (date: DateTime, bucket: TimeScale): string => {
  if (bucket === TimeScale.All) {
    return timeBucketFormats[bucket];
  } else if (bucket === TimeScale.Decade) {
    return (Math.floor(date.year / 10) * 10).toString();
  } else {
    const format = timeBucketFormats[bucket];
    return date.toFormat(format);
  }
};

const parseTimeBucket = (
  date: string,
  bucket: TimeScale,
  timezone: string,
): DateTime => {
  if (bucket === TimeScale.All) {
    return DateTime.fromObject({ year: 0 }, { zone: timezone });
  } else if (bucket === TimeScale.Decade) {
    return DateTime.fromObject({ year: parseInt(date) }, { zone: timezone });
  } else {
    return DateTime.fromFormat(date, timeBucketFormats[bucket], {
      zone: timezone,
    });
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

// TODO: might replace this with just filling every bucket in the range
const fillTimeBuckets = <R>(
  range: DateRange,
  counts: Record<string, R>,
  getDefault: (dateString: string) => R,
): void => {
  const dates = Object.keys(counts).map((date) =>
    parseTimeBucket(date, range.scale, range.timezone),
  );

  if (dates.length === 0) return;

  const minDate = DateTime.min(...dates);
  const maxDate = DateTime.max(...dates);

  for (const currentDate of createTimeBuckets(minDate, maxDate, range.scale)) {
    const dateString = formatTimeBucket(currentDate, range.scale);
    if (!(dateString in counts)) {
      counts[dateString] = getDefault(dateString);
    }
  }
};

const MAX_BUCKET_COUNT = 10000;

export const generateSeriesPoints = <T, R>(
  items: T[],
  range: PartialDateRange,
  getDate: (item: T) => DateTime | DateTime[] | undefined,
  getValue: (prev: R | undefined, item: T) => R,
  getDefault: (dateString: string) => R,
): SeriesPoint<R>[] => {
  const dateRange = DateRange.fill(range);
  const counts: Record<string, R> = {};

  const bucketCount = createTimeBuckets(
    DateTime.fromJSDate(dateRange.startDate),
    DateTime.fromJSDate(dateRange.endDate),
    dateRange.scale,
  ).length;

  if (bucketCount >= MAX_BUCKET_COUNT) {
    throw new BadRequestException(
      `Your request results in too many data points (${bucketCount}/${MAX_BUCKET_COUNT}). ` +
        `Please select a smaller range or larger bucket size.`,
    );
  }

  for (const item of items) {
    let dates = getDate(item) ?? [];
    dates = Array.isArray(dates) ? dates : [dates];

    for (const date of dates) {
      const dateInZone = date.setZone(range.timezone);
      const dateString = formatTimeBucket(dateInZone, dateRange.scale);
      counts[dateString] = getValue(counts[dateString], item);
    }
  }

  fillTimeBuckets(dateRange, counts, getDefault);

  return Object.keys(counts)
    .map((dateString) => ({
      date: dateString,
      value: counts[dateString]!,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, value }) => ({
      date: parseTimeBucket(
        date,
        dateRange.scale,
        dateRange.timezone,
      ).toJSDate(),
      value,
    }));
};

export const generateSeriesCountPoints = <T>(
  items: T[],
  range: PartialDateRange,
  getDate: (item: T) => DateTime | DateTime[] | undefined,
): SeriesCountPoint[] =>
  generateSeriesPoints(
    items,
    range,
    getDate,
    (prev) => (prev ?? 0) + 1,
    () => 0,
  ).map((e) => new SeriesCountPoint(e));

export const generateSeriesRecordPoints = <T, R extends Record<string, number>>(
  items: T[],
  range: PartialDateRange,
  getDate: (item: T) => DateTime | DateTime[] | undefined,
  getKey: (item: T) => keyof R,
  keys: (keyof R)[],
): SeriesPoint<R>[] => {
  const getDefault = () => {
    const emptyRecord: Partial<R> = {};
    for (const key of keys) {
      emptyRecord[key] = 0 as R[keyof R];
    }
    return emptyRecord as R;
  };
  return generateSeriesPoints<T, R>(
    items,
    range,
    getDate,
    (prev, item) => {
      return {
        ...(prev ?? getDefault()),
        [getKey(item)]: (prev?.[getKey(item)] ?? 0) + 1,
      } as R;
    },
    getDefault,
  );
};
