import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { SeriesCountPoint, SeriesPoint } from './chart.dto';
import { DateRange, PartialDateRange, TimeScale } from './date-range.dto';

const binarySearchClosestBucket = (arr: Date[], date: Date): number => {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid]! <= date && (mid === arr.length - 1 || arr[mid + 1]! > date)) {
      return mid;
    } else if (arr[mid]! < date) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
};

export const assignDateBuckets = <T>(
  dates: (Date | DateRange | undefined)[],
  buckets: Date[],
  items: readonly T[],
): Record<number, T[]> => {
  const bucketAssignments: Record<number, T[]> = {};
  buckets.forEach((bucket) => {
    bucketAssignments[bucket.getTime()] = [];
  });

  dates.forEach((entry, i) => {
    if (entry === undefined) return;

    const item = items[i];
    if (item === undefined) return;

    if (entry instanceof Date) {
      const bucketIndex = binarySearchClosestBucket(buckets, entry);
      if (bucketIndex !== -1 && buckets[bucketIndex]) {
        bucketAssignments[buckets[bucketIndex].getTime()]!.push(item);
      }
    } else if (
      entry != undefined &&
      typeof entry === 'object' &&
      'startDate' in entry &&
      'endDate' in entry
    ) {
      const startIndex = binarySearchClosestBucket(buckets, entry.startDate);
      const endIndex = binarySearchClosestBucket(buckets, entry.endDate);

      if (startIndex !== -1 && endIndex !== -1) {
        for (let j = startIndex; j <= endIndex && j < buckets.length; j++) {
          if (buckets[j]) {
            bucketAssignments[buckets[j]!.getTime()]!.push(item);
          }
        }
      }
    }
  });

  return bucketAssignments;
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

export const createTimeBuckets = (range: DateRange): Date[] => {
  const start = DateTime.fromJSDate(range.startDate, {
    zone: range.timezone,
  });
  const end = DateTime.min(
    DateTime.fromJSDate(range.endDate, { zone: range.timezone }),
    DateTime.now().setZone(range.timezone).endOf('day'),
  );

  const buckets = [];
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = incrementTimeBucket(currentDate, range.scale)
  ) {
    buckets.push(currentDate.toJSDate());
  }
  return buckets;
};

const MAX_BUCKET_COUNT = 10000;

export const generateSeriesPoints = <T>(
  items: readonly T[],
  dates: (Date | DateRange | undefined)[],
  range: PartialDateRange,
): SeriesPoint<T[]>[] => {
  const dateRange = DateRange.fill(range);

  const buckets = createTimeBuckets(dateRange);

  if (buckets.length >= MAX_BUCKET_COUNT) {
    throw new BadRequestException(
      `Your request results in too many data points (${buckets.length}/${MAX_BUCKET_COUNT}). ` +
        `Please select a smaller range or larger bucket size.`,
    );
  }

  const assignments: Record<number, T[]> = assignDateBuckets(
    dates,
    buckets,
    items,
  );

  return Object.entries(assignments).map(([date, items]) => ({
    date: new Date(+date),
    value: items,
  }));
};

export const generateSeriesCountPoints = (
  dates: (Date | DateRange | undefined)[],
  range: PartialDateRange,
): SeriesCountPoint[] =>
  generateSeriesPoints(
    Array.from({ length: dates.length }, (_, i) => i),
    dates,
    range,
  ).map(
    (e) =>
      new SeriesCountPoint({
        date: e.date,
        value: e.value.length,
      }),
  );

export const generateSeriesRecordPoints = <R extends Record<string, number>>(
  dates: (Date | DateRange | undefined)[],
  keys: readonly (keyof R)[],
  allKeys: readonly (keyof R)[],
  range: PartialDateRange,
): SeriesPoint<R>[] => {
  return generateSeriesPoints(keys, dates, range).map((e) => ({
    date: e.date,
    value: allKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: e.value.reduce(
          (count, item) => count + (item === key ? 1 : 0),
          0,
        ),
      }),
      {} as R,
    ),
  }));
};
