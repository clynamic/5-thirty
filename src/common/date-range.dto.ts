import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import { DateTime } from 'luxon';
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
  @Transform((opts) =>
    opts.value
      ? DateTime.fromISO(opts.value, {
          zone: opts.obj.timezone ?? 'UTC',
        }).toJSDate()
      : undefined,
  )
  startDate?: Date;

  /**
   * End date for the range, inclusive
   */
  @IsOptional()
  @IsDate()
  @Transform((opts) =>
    opts.value
      ? DateTime.fromISO(opts.value, {
          zone: opts.obj.timezone ?? 'UTC',
        }).toJSDate()
      : undefined,
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
      start = DateTime.fromJSDate(this.startDate)
        .minus({
          days: 1,
        })
        // TODO: e6 uses the request timezone, not UTC.
        // but how would we which timezone that is?
        .toUTC()
        .toISODate()!;
    }

    if (this.endDate) {
      end = DateTime.fromJSDate(this.endDate)
        .plus({
          days: 1,
        })
        .toUTC()
        .toISODate()!;
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
    DateTime.fromISO(opts.value, {
      zone: opts.obj.timezone ?? 'UTC',
    }).toJSDate(),
  )
  override startDate: Date;

  @IsDate()
  @Transform((opts) =>
    DateTime.fromISO(opts.value, {
      zone: opts.obj.timezone ?? 'UTC',
    }).toJSDate(),
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
        endDate: DateTime.fromJSDate(range.startDate, {
          zone: range.timezone ?? 'UTC',
        })
          .endOf('month')
          .toJSDate(),
        ...range,
      });
    } else if (range?.endDate) {
      return new DateRange({
        startDate: DateTime.fromJSDate(range.endDate, {
          zone: range.timezone ?? 'UTC',
        })
          .startOf('month')
          .toJSDate(),
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
    const now = DateTime.now().setZone(value?.timezone ?? 'UTC');
    return new DateRange({
      startDate: now
        .minus({
          months,
        })
        .startOf('month')
        .toJSDate(),
      endDate: now.endOf('month').toJSDate(),
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

  override find(): FindOperator<Date> {
    return super.find()!;
  }

  override where(): FindOptionsWhere<WithCreationDate> {
    return super.where()!;
  }
}
