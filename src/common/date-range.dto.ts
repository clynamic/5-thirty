import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import {
  addDays,
  endOfMonth,
  formatISO,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
 * A bucket of time for grouping dates.
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
    value ? toZonedTime(parseISO(value), obj.timezone || 'UTC') : undefined,
  )
  startDate?: Date;

  /**
   * End date for the range, inclusive
   */
  @IsOptional()
  @IsDate()
  @Transform(({ value, obj }) =>
    value ? toZonedTime(parseISO(value), obj.timezone || 'UTC') : undefined,
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
  scale?: TimeScale;

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

  /**
   * Turns a date range into a string fit for an e621 search query.
   * Inclusive on both ends.
   */
  toE621RangeString(): string {
    let start = '';
    let end = '';

    if (this.startDate) {
      // TODO: e6 uses the request timezone, not UTC.
      // How would we determine which timezone that is?
      start = formatISO(
        subDays(toZonedTime(this.startDate, this.timezone || 'UTC'), 1),
        { representation: 'date' },
      );
    }

    if (this.endDate) {
      end = formatISO(
        addDays(toZonedTime(this.endDate, this.timezone || 'UTC'), 1),
        { representation: 'date' },
      );
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
  constructor(value: PartialBy<Raw<DateRange>, 'timezone' | 'scale'>) {
    super({
      timezone: 'UTC',
      scale: TimeScale.Day,
      ...value,
    });
  }

  @IsDate()
  @Transform((opts) =>
    toZonedTime(parseISO(opts.value), opts.obj.timezone || 'UTC'),
  )
  override startDate: Date;

  @IsDate()
  @Transform((opts) =>
    toZonedTime(parseISO(opts.value), opts.obj.timezone || 'UTC'),
  )
  override endDate: Date;

  @IsTimeZone()
  override timezone: string;

  @IsEnum(TimeScale)
  override scale: TimeScale;

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
        endDate: endOfMonth(
          toZonedTime(range.startDate, range.timezone || 'UTC'),
        ),
        ...range,
      });
    } else if (range?.endDate) {
      return new DateRange({
        startDate: startOfMonth(
          toZonedTime(range.endDate, range.timezone || 'UTC'),
        ),
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
    months: number = 3,
    value?: Omit<Raw<PartialDateRange>, 'startDate' | 'endDate'>,
  ): DateRange {
    const now = toZonedTime(new Date(), value?.timezone || 'UTC');
    return new DateRange({
      startDate: startOfMonth(subMonths(now, months)),
      endDate: endOfMonth(now),
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
}
