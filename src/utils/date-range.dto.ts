import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsTimeZone } from 'class-validator';
import { DateTime } from 'luxon';
import {
  Between,
  FindOperator,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

import { PartialBy, Raw } from './raw';

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
  timezone?: string;

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
  constructor(value: PartialBy<Raw<DateRange>, 'timezone'>) {
    super({
      timezone: 'UTC',
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
        timezone: range.timezone,
      });
    } else if (range?.startDate) {
      return new DateRange({
        startDate: range.startDate,
        endDate: DateTime.fromJSDate(range.startDate, {
          zone: range.timezone ?? 'UTC',
        })
          .endOf('month')
          .toJSDate(),
        timezone: range.timezone,
      });
    } else if (range?.endDate) {
      return new DateRange({
        startDate: DateTime.fromJSDate(range.endDate, {
          zone: range.timezone ?? 'UTC',
        })
          .startOf('month')
          .toJSDate(),
        endDate: range.endDate,
        timezone: range.timezone,
      });
    }

    return DateRange.currentMonth();
  }

  /**
   * Returns a date range for the last `months` months.
   */
  static recentMonths(months: number = 3): DateRange {
    const now = DateTime.now();
    return new DateRange({
      startDate: now
        .minus({
          months,
        })
        .startOf('month')
        .toJSDate(),
      endDate: now.endOf('month').toJSDate(),
    });
  }

  /**
   * Returns a date range for the current month.
   */
  static currentMonth(): DateRange {
    return new DateRange(DateRange.recentMonths(0));
  }

  override find(): FindOperator<Date> {
    return super.find()!;
  }

  override where(): FindOptionsWhere<WithCreationDate> {
    return super.where()!;
  }
}

export interface WithCreationDate {
  createdAt: Date;
}

/**
 * Finds the least recent creation date in a list of items.
 */
export const findLowestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    DateTime.fromJSDate(prev.createdAt) < DateTime.fromJSDate(current.createdAt)
      ? prev
      : current,
  );
};

/**
 * Finds the most recent creation date in a list of items.
 */
export const findHighestDate = <T extends WithCreationDate>(
  items: T[] | undefined,
): T | undefined => {
  if (items === undefined || items.length === 0) return undefined;
  return items.reduce((prev, current) =>
    DateTime.fromJSDate(prev.createdAt) > DateTime.fromJSDate(current.createdAt)
      ? prev
      : current,
  );
};

export const fillDateCounts = (
  range: PartialDateRange,
  counts: Record<string, number>,
): void => {
  const dates = Object.keys(counts).map((date) =>
    DateTime.fromISO(date, { zone: range.timezone }),
  );

  if (dates.length === 0) return;

  const minDate = DateTime.min(...dates);
  const maxDate = DateTime.max(...dates);

  for (
    let currentDate = minDate;
    currentDate <= maxDate;
    currentDate = currentDate.plus({ days: 1 })
  ) {
    const dateString = currentDate.toISODate()!;
    if (!(dateString in counts)) {
      counts[dateString] = 0;
    }
  }
};

export const fillStackedDateCounts = (
  range: PartialDateRange,
  counts: Record<string, Record<string, number>>,
  keys: string[],
): void => {
  const dates = Object.keys(counts).map((date) =>
    DateTime.fromISO(date, { zone: range.timezone }),
  );

  if (dates.length === 0) return;

  const minDate = DateTime.min(...dates);
  const maxDate = DateTime.max(...dates);

  for (
    let currentDate = minDate;
    currentDate <= maxDate;
    currentDate = currentDate.plus({ days: 1 })
  ) {
    const dateString = currentDate.toISODate()!;
    if (!(dateString in counts)) {
      counts[dateString] = {};
    }

    for (const key of keys) {
      if (!(key in counts[dateString]!)) {
        counts[dateString]![key] = 0;
      }
    }
  }
};
