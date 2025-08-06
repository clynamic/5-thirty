import { TZDate, tz } from '@date-fns/tz';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import {
  ContextOptions,
  Duration,
  FormatISOOptions,
  add,
  addDays,
  endOfMonth,
  formatISO,
  parseISO,
  startOfMonth,
  sub,
  subDays,
  subMonths,
} from 'date-fns';
import {
  Between,
  FindOperator,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

import { WithCreationDate } from './date-objects';
import { PartialBy, Raw } from './raw';

/**
 * A measure of time, used to group or normalize date points.
 */
export enum TimeScale {
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
  Decade = 'decade',
  All = 'all',
}

export const getClosestTimeScale = (
  dateRange: Pick<DateRange, 'startDate' | 'endDate'>,
): TimeScale => {
  const { startDate, endDate } = dateRange;
  const diffInMs = Math.abs(endDate.getTime() - startDate.getTime());

  const msPerMinute = 60 * 1000;
  const msPerHour = 60 * msPerMinute;
  const msPerDay = 24 * msPerHour;
  const msPerWeek = 7 * msPerDay;
  const msPerMonth = 30 * msPerDay;
  const msPerYear = 365 * msPerDay;
  const msPerDecade = 10 * msPerYear;

  const timeScales = [
    { scale: TimeScale.Minute, ms: msPerMinute },
    { scale: TimeScale.Hour, ms: msPerHour },
    { scale: TimeScale.Day, ms: msPerDay },
    { scale: TimeScale.Week, ms: msPerWeek },
    { scale: TimeScale.Month, ms: msPerMonth },
    { scale: TimeScale.Year, ms: msPerYear },
    { scale: TimeScale.Decade, ms: msPerDecade },
  ];

  const closest = timeScales.reduce((prev, curr) => {
    const prevDiff = Math.abs(diffInMs - prev.ms);
    const currDiff = Math.abs(diffInMs - curr.ms);
    return currDiff < prevDiff ? curr : prev;
  });

  return diffInMs > msPerDecade ? TimeScale.All : closest.scale;
};

export const getDurationKeyForScale = (scale: TimeScale): keyof Duration => {
  switch (scale) {
    case TimeScale.Minute:
      return 'minutes';
    case TimeScale.Hour:
      return 'hours';
    case TimeScale.Day:
      return 'days';
    case TimeScale.Week:
      return 'weeks';
    case TimeScale.Month:
      return 'months';
    case TimeScale.Year:
      return 'years';
    case TimeScale.Decade:
      return 'years';
    case TimeScale.All:
      return 'years';
  }
};

export const inferScaleForCycle = (
  cycle?: TimeScale,
): TimeScale | undefined => {
  if (!cycle) return undefined;

  const orderedScales: TimeScale[] = [
    // there is no smaller scale than Minute
    TimeScale.Minute,
    TimeScale.Hour,
    TimeScale.Day,
    TimeScale.Week,
    TimeScale.Month,
    TimeScale.Year,
    TimeScale.Decade,
    // there is no sensible default for TimeScale.All
  ];

  const index = orderedScales.indexOf(cycle) - 1;
  if (index < 0) return undefined;
  return orderedScales[index];
};

export const inferDefaultScale = (
  dateRange: PartialBy<
    Pick<DateRange, 'startDate' | 'endDate' | 'cycle'>,
    'cycle'
  >,
): TimeScale => {
  const { startDate, endDate, cycle } = dateRange;

  const cycleBased = inferScaleForCycle(cycle);
  if (cycleBased) return cycleBased;

  if (!startDate || !endDate) return TimeScale.Day;

  const diffInMs = Math.abs(endDate.getTime() - startDate.getTime());
  const hours = diffInMs / (1000 * 60 * 60);
  const days = hours / 24;
  const months = days / 30;
  const years = days / 365;

  if (hours <= 2) return TimeScale.Minute;
  if (days <= 2) return TimeScale.Hour;
  if (months <= 1.1) return TimeScale.Day;
  if (months <= 2) return TimeScale.Week;
  if (years <= 2) return TimeScale.Month;
  if (years <= 10) return TimeScale.Year;
  return TimeScale.Decade;
};

/**
 * A range of dates, inclusive on both ends.
 * May be missing one or both ends.
 */
export class PartialDateRange {
  constructor(value: Raw<PartialDateRange> = {}) {
    Object.assign(this, value);
  }

  /**
   * Start date for the range, inclusive.
   */
  @IsOptional()
  @IsDate()
  @Transform(({ value, obj }) =>
    value ? parseISO(value, { in: tz(obj.timezone || 'UTC') }) : undefined,
  )
  startDate?: Date;

  /**
   * End date for the range, inclusive
   */
  @IsOptional()
  @IsDate()
  @Transform(({ value, obj }) =>
    value ? parseISO(value, { in: tz(obj.timezone || 'UTC') }) : undefined,
  )
  endDate?: Date;

  /**
   * Target timezone for the date range.
   */
  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  /**
   * Size of the time bucket for the range.
   */
  @IsOptional()
  @IsEnum(TimeScale)
  @ApiProperty({ enum: TimeScale, enumName: 'TimeScale' })
  scale?: TimeScale;

  /**
   * Which part of the dates should be cyclic.
   */
  @IsOptional()
  @IsEnum(TimeScale)
  @ApiProperty({ enum: TimeScale, enumName: 'TimeScale' })
  cycle?: TimeScale;

  find(): FindOperator<Date> | undefined {
    return this.startDate
      ? this.endDate
        ? Between(this.startDate, this.endDate)
        : MoreThanOrEqual(this.startDate)
      : this.endDate
        ? LessThanOrEqual(this.endDate)
        : undefined;
  }

  where(): FindOptionsWhere<WithCreationDate> | undefined {
    return {
      createdAt: this.find(),
    };
  }

  in(): ContextOptions<TZDate> {
    return { in: this.timezone ? tz(this.timezone) : undefined };
  }

  /**
   * Turns a date range into a string fit for an e621 search query.
   * Inclusive on both ends.
   */
  toE621RangeString(): string {
    let start = '';
    let end = '';
    const asDate: FormatISOOptions = { representation: 'date' };

    if (this.startDate) {
      start = formatISO(subDays(this.startDate, 1, this.in()), asDate);
    }

    if (this.endDate) {
      end = formatISO(addDays(this.endDate, 1, this.in()), asDate);
    }

    if (start && !end) {
      return `>${start}`;
    } else if (!start && end) {
      return `<${end}`;
    } else if (start && end) {
      return `${start}..${end}`;
    } else {
      return '';
    }
  }
}

/**
 * A range of dates, inclusive on both ends.
 */
export class DateRange extends PartialDateRange {
  constructor(
    value: PartialBy<Raw<DateRange>, 'timezone' | 'scale' | 'cycle'>,
  ) {
    super({
      timezone: 'UTC',
      scale: inferDefaultScale(value),
      cycle: TimeScale.All,
      ...value,
    });
  }

  @IsDate()
  @Transform((opts) =>
    parseISO(opts.value, { in: tz(opts.obj.timezone || 'UTC') }),
  )
  override startDate: Date;

  @IsDate()
  @Transform((opts) =>
    parseISO(opts.value, { in: tz(opts.obj.timezone || 'UTC') }),
  )
  override endDate: Date;

  @IsTimeZone()
  override timezone: string;

  @IsEnum(TimeScale)
  @ApiProperty({ enum: TimeScale, enumName: 'TimeScale' })
  override scale: TimeScale;

  @IsEnum(TimeScale)
  @ApiProperty({ enum: TimeScale, enumName: 'TimeScale' })
  override cycle: TimeScale;

  /**
   * Fills in missing dates in a partial date range.
   * If both dates are missing, defaults to the current month.
   * If only one date is missing, defaults to the start or end of the month.
   */
  static fill(range?: Raw<PartialDateRange>): DateRange {
    if (range?.startDate && range?.endDate) {
      return new DateRange({
        startDate: range.startDate,
        endDate: range.endDate,
        ...range,
      });
    } else if (range?.startDate) {
      return new DateRange({
        startDate: range.startDate,
        endDate: endOfMonth(range.startDate, {
          in: tz(range.timezone || 'UTC'),
        }),
        ...range,
      });
    } else if (range?.endDate) {
      return new DateRange({
        startDate: startOfMonth(range.endDate, {
          in: tz(range.timezone || 'UTC'),
        }),
        endDate: range.endDate,
        ...range,
      });
    }

    return DateRange.currentMonth(range);
  }

  /**
   * Returns a date range for the last `months` months.
   */
  static recentMonths(
    months: number = 12,
    value?: Omit<Raw<PartialDateRange>, 'startDate' | 'endDate'>,
  ): DateRange {
    const timezone = value?.timezone || 'UTC';
    const now = new Date();
    return new DateRange({
      startDate: startOfMonth(subMonths(now, months, { in: tz(timezone) }), {
        in: tz(timezone),
      }),
      endDate: endOfMonth(now, { in: tz(timezone) }),
      ...value,
    });
  }

  /**
   * Returns a date range for the current month.
   */
  static currentMonth(
    value?: Omit<Raw<PartialDateRange>, 'startDate' | 'endDate'>,
  ): DateRange {
    return new DateRange(DateRange.recentMonths(0, value));
  }

  /**
   * Returns a fixed date range for 1970-01-01, covering all hours of the day.
   */
  static hoursOnly(timezone?: string): DateRange {
    return new DateRange({
      startDate: new Date(1970, 1, 1),
      endDate: new Date(1970, 1, 1, 23, 59, 59, 999),
      scale: TimeScale.Hour,
      timezone: timezone,
    });
  }

  override find(): FindOperator<Date> {
    return super.find()!;
  }

  override where(): FindOptionsWhere<WithCreationDate> {
    return super.where()!;
  }

  expand(scale: TimeScale, amount: number = 1): DateRange {
    const duration = getDurationKeyForScale(scale);
    return new DateRange({
      ...this,
      startDate: sub(this.startDate, { [duration]: amount }, this.in()),
      endDate: add(this.endDate, { [duration]: amount }, this.in()),
    });
  }
}
