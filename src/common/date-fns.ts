import {
  Duration,
  endOfDay,
  endOfDecade,
  endOfHour,
  endOfMinute,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isValid,
  parseISO,
  startOfDay,
  startOfDecade,
  startOfHour,
  startOfMinute,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import { TimeScale } from './date-range.dto';

export const scaleToDuration = (scale: TimeScale): keyof Duration => {
  if (scale === TimeScale.All || scale === TimeScale.Decade) {
    throw new Error('Cannot convert All or Decade to duration');
  }

  return {
    [TimeScale.Minute]: 'minutes',
    [TimeScale.Hour]: 'hours',
    [TimeScale.Day]: 'days',
    [TimeScale.Week]: 'weeks',
    [TimeScale.Month]: 'months',
    [TimeScale.Year]: 'years',
  }[scale] as keyof Duration;
};

export const startOf = (unit: TimeScale, date: Date): Date => {
  switch (unit) {
    case TimeScale.Minute:
      return startOfMinute(date);
    case TimeScale.Hour:
      return startOfHour(date);
    case TimeScale.Day:
      return startOfDay(date);
    case TimeScale.Week:
      return startOfWeek(date);
    case TimeScale.Month:
      return startOfMonth(date);
    case TimeScale.Year:
      return startOfYear(date);
    case TimeScale.Decade:
      return startOfDecade(date);
    case TimeScale.All:
      return new Date(0);
  }
};

export const endOf = (unit: TimeScale, date: Date): Date => {
  switch (unit) {
    case TimeScale.Minute:
      return endOfMinute(date);
    case TimeScale.Hour:
      return endOfHour(date);
    case TimeScale.Day:
      return endOfDay(date);
    case TimeScale.Week:
      return endOfWeek(date);
    case TimeScale.Month:
      return endOfMonth(date);
    case TimeScale.Year:
      return endOfYear(date);
    case TimeScale.Decade:
      return endOfDecade(date);
    case TimeScale.All:
      return new Date(9999);
  }
};

export const collapseTimeScaleDuration = (scale: TimeScale): keyof Duration => {
  return (
    (
      {
        [TimeScale.Minute]: 'minutes',
        [TimeScale.Hour]: 'hours',
      } as Record<TimeScale, keyof Duration>
    )[scale] || 'days'
  );
};

export function convertKeysToDate<
  T extends Record<string, any>,
  K extends keyof T,
>(
  obj: T,
  keys: K[],
): {
  [P in keyof T]: P extends K
    ? T[P] extends string
      ? Date
      : T[P] extends string | null
        ? Date | null
        : T[P]
    : T[P];
} {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (keys.includes(key as K)) {
      (acc as any)[key] =
        value instanceof Date
          ? value
          : value === null
            ? null
            : isValid(parseISO(value))
              ? parseISO(value)
              : value;
    } else {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as any);
}
