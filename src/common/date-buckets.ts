import { BadRequestException } from '@nestjs/common';
import { add, addYears, endOfDay, getDayOfYear, min, set } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { SeriesCountPoint, SeriesPoint } from './chart.dto';
import { scaleToDuration } from './date-fns';
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
  dates: DatePoint[],
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

      if (bucketIndex === -1) {
        throw new Error(
          `No bucket found for entry: ${entry} with buckets: ${buckets}`,
        );
      }

      bucketAssignments[buckets[bucketIndex]!.getTime()]!.push(item);
    } else if (
      entry !== undefined &&
      typeof entry === 'object' &&
      'startDate' in entry &&
      'endDate' in entry
    ) {
      const startIndex = binarySearchClosestBucket(buckets, entry.startDate);
      const endIndex = binarySearchClosestBucket(buckets, entry.endDate);

      if (startIndex === -1 || endIndex === -1) {
        throw new Error(
          `Invalid range for entry: ${JSON.stringify(entry)}. StartIndex: ${startIndex}, EndIndex: ${endIndex} with buckets: ${buckets}`,
        );
      }

      for (let j = startIndex; j <= endIndex && j < buckets.length; j++) {
        bucketAssignments[buckets[j]!.getTime()]!.push(item);
      }
    }
  });

  return bucketAssignments;
};

const incrementTimeBucket = (date: Date, bucket: TimeScale): Date => {
  if (bucket === TimeScale.All) {
    return addYears(date, 9999);
  } else if (bucket === TimeScale.Decade) {
    return addYears(date, 10);
  } else {
    return add(date, { [scaleToDuration(bucket)]: 1 });
  }
};

export const createTimeBuckets = (range: DateRange): Date[] => {
  const start = toZonedTime(range.startDate, range.timezone);

  const end = min([
    toZonedTime(range.endDate, range.timezone),
    endOfDay(toZonedTime(new Date(), range.timezone)),
  ]);

  const buckets = [];
  for (
    let currentDate = start;
    currentDate <= end;
    currentDate = incrementTimeBucket(currentDate, range.scale)
  ) {
    buckets.push(currentDate);
  }
  return buckets;
};

const setDateCycle = (date: Date, cycle: TimeScale): Date => {
  switch (cycle) {
    case TimeScale.All:
      return date;
    case TimeScale.Decade:
      return set(date, { year: 1970 + (date.getFullYear() % 10) });
    case TimeScale.Year:
      return set(date, { year: 1970 });
    case TimeScale.Month:
      return set(date, { year: 1970, month: 0 });
    case TimeScale.Week:
      return set(date, {
        year: 1970,
        month: 0,
        date: (getDayOfYear(date) % 7) + 1,
      });
    case TimeScale.Day:
      return set(date, { year: 1970, month: 0, date: 1 });
    case TimeScale.Hour:
      return set(date, { year: 1970, month: 0, date: 1, hours: 0 });
    case TimeScale.Minute:
      return set(date, { year: 1970, month: 0, date: 1, hours: 0, minutes: 0 });
  }
};

const applyDateCycle = (dates: DatePoint[], cycle: TimeScale): DatePoint[] => {
  return dates.map((date) => {
    if (date instanceof Date) {
      return setDateCycle(date, cycle);
    } else if (
      date != undefined &&
      typeof date === 'object' &&
      'startDate' in date &&
      'endDate' in date
    ) {
      return new DateRange({
        ...date,
        startDate: setDateCycle(date.startDate, cycle),
        endDate: setDateCycle(date.endDate, cycle),
      });
    }
    return date;
  });
};

const resolveRangeCycle = (range: DateRange): DateRange => {
  const [startDate, endDate] = (() => {
    switch (range.cycle) {
      case TimeScale.All:
        return [range.startDate, range.endDate];
      case TimeScale.Decade:
        return [new Date(1970, 0, 1), new Date(1979, 11, 31, 23, 59, 59, 999)];
      case TimeScale.Year:
        return [new Date(1970, 0, 1), new Date(1970, 11, 31, 23, 59, 59, 999)];
      case TimeScale.Month:
        return [new Date(1970, 0, 1), new Date(1970, 0, 31, 23, 59, 59, 999)];
      case TimeScale.Week:
        return [new Date(1970, 0, 1), new Date(1970, 0, 7, 23, 59, 59, 999)];
      case TimeScale.Day:
        return [new Date(1970, 0, 1), new Date(1970, 0, 1, 23, 59, 59, 999)];
      case TimeScale.Hour:
        return [new Date(1970, 0, 1, 0), new Date(1970, 0, 1, 0, 59, 59, 999)];
      case TimeScale.Minute:
        return [
          new Date(1970, 0, 1, 0, 0),
          new Date(1970, 0, 1, 0, 0, 59, 999),
        ];
    }
  })();

  return new DateRange({
    ...range,
    startDate,
    endDate,
  });
};

export type DatePoint = Date | DateRange | undefined;

const MAX_BUCKET_COUNT = 10000;

export const generateSeriesPoints = <T>(
  items: T[],
  dates: DatePoint[],
  range: PartialDateRange,
): SeriesPoint<T[]>[] => {
  let dateRange = DateRange.fill(range);

  // resolve cycles
  dateRange = resolveRangeCycle(dateRange);
  dates = applyDateCycle(dates, dateRange.cycle);

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
  dates: DatePoint[],
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
  dates: DatePoint[],
  keys: readonly (keyof R)[],
  allKeys: readonly (keyof R)[],
  range: PartialDateRange,
): SeriesPoint<R>[] => {
  return generateSeriesPoints([...keys], dates, range).map((e) => ({
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
