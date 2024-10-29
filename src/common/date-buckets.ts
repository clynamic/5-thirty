import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { SeriesCountPoint } from './chart.dto';
import { DateRange, PartialDateRange, TimeBucket } from './date-range.dto';

const timeBucketFormats = {
  [TimeBucket.Minute]: 'yyyy-MM-dd HH:mm',
  [TimeBucket.Hour]: 'yyyy-MM-dd HH',
  [TimeBucket.Day]: 'yyyy-MM-dd',
  [TimeBucket.Week]: "kkkk-'W'WW",
  [TimeBucket.Month]: 'yyyy-MM',
  [TimeBucket.Year]: 'yyyy',
  [TimeBucket.Decade]: 'yyyy',
  [TimeBucket.All]: 'all',
};

const getBucketedDateString = (date: DateTime, bucket: TimeBucket): string => {
  if (bucket === TimeBucket.All) {
    return timeBucketFormats[bucket];
  } else if (bucket === TimeBucket.Decade) {
    return (Math.floor(date.year / 10) * 10).toString();
  } else {
    const format = timeBucketFormats[bucket];
    return date.toFormat(format);
  }
};

const parseBucketedDateString = (
  date: string,
  bucket: TimeBucket,
  timezone: string,
): DateTime => {
  if (bucket === TimeBucket.All) {
    return DateTime.fromObject({ year: 0 }, { zone: timezone });
  } else if (bucket === TimeBucket.Decade) {
    return DateTime.fromObject({ year: parseInt(date) }, { zone: timezone });
  } else {
    return DateTime.fromFormat(date, timeBucketFormats[bucket], {
      zone: timezone,
    });
  }
};

const incrementBucketedDate = (
  date: DateTime,
  bucket: TimeBucket,
): DateTime => {
  if (bucket === TimeBucket.All) {
    return date.plus({ years: 9999 });
  } else if (bucket === TimeBucket.Decade) {
    return date.plus({ years: 10 });
  } else {
    return date.plus({ [bucket]: 1 });
  }
};

const calculateBucketCount = (
  start: DateTime,
  end: DateTime,
  bucket: TimeBucket,
): number => {
  let count = 0;
  let currentDate = start;
  while (currentDate <= end) {
    count++;
    currentDate = incrementBucketedDate(currentDate, bucket);
  }
  return count;
};

const fillDateCounts = (
  range: DateRange,
  counts: Record<string, number>,
): void => {
  const dates = Object.keys(counts).map((date) =>
    parseBucketedDateString(date, range.bucket, range.timezone),
  );

  if (dates.length === 0) return;

  const minDate = DateTime.min(...dates);
  const maxDate = DateTime.max(...dates);

  for (
    let currentDate = minDate;
    currentDate <= maxDate;
    currentDate = incrementBucketedDate(currentDate, range.bucket)
  ) {
    const dateString = getBucketedDateString(currentDate, range.bucket);
    if (!(dateString in counts)) {
      counts[dateString] = 0;
    }
  }
};

const MAX_BUCKET_COUNT = 10000;

export const generateSeriesCountPoints = <T>(
  items: T[],
  range: PartialDateRange,
  getDate: (item: T) => DateTime | DateTime[] | undefined,
): SeriesCountPoint[] => {
  const dateRange = DateRange.fill(range);
  const counts: Record<string, number> = {};

  const bucketCount = calculateBucketCount(
    DateTime.fromJSDate(dateRange.startDate),
    DateTime.fromJSDate(dateRange.endDate),
    dateRange.bucket,
  );

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
      const dateString = getBucketedDateString(dateInZone, dateRange.bucket);
      counts[dateString] = (counts[dateString] || 0) + 1;
    }
  }

  fillDateCounts(dateRange, counts);

  return Object.keys(counts)
    .map((dateString) => ({
      date: parseBucketedDateString(
        dateString,
        dateRange.bucket,
        dateRange.timezone,
      ).toJSDate(),
      count: counts[dateString] ?? 0,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(
      ({ date, count }) =>
        new SeriesCountPoint({
          date,
          count,
        }),
    );
};
