import {
  Duration,
  endOfDay,
  endOfDecade,
  endOfHour,
  endOfMinute,
  endOfMonth,
  endOfWeek,
  endOfYear,
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
