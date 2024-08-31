import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

import {
  getCurrentMonthRange,
  getDateRangeString,
  WithCreationDate,
} from './range';

/**
 * A range of dates, inclusive on both ends.
 * May be missing one or both ends.
 */
export class PartialDateRange {
  constructor(partial?: Partial<PartialDateRange>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * start date for the range, inclusive.
   */
  startDate?: Date;

  /**
   * end date for the range, inclusive
   */
  endDate?: Date;

  static currentMonth(): DateRange {
    return getCurrentMonthRange();
  }

  toWhereOptions(): FindOptionsWhere<WithCreationDate> | undefined {
    return {
      createdAt: this.startDate
        ? this.endDate
          ? Between(this.startDate, this.endDate)
          : MoreThanOrEqual(this.startDate)
        : this.endDate
          ? LessThanOrEqual(this.endDate)
          : undefined,
    };
  }

  toRangeString(): string {
    return getDateRangeString(this);
  }
}

/**
 * A range of dates, inclusive on both ends.
 */
export class DateRange extends PartialDateRange {
  constructor(partial?: Partial<DateRange>) {
    super(partial);
  }

  override startDate: Date;

  override endDate: Date;

  /**
   * Returns the date range, or, if no range is provided, the current month.
   */
  static orCurrentMonth(range?: PartialDateRange): DateRange {
    return new DateRange({
      ...getCurrentMonthRange(),
      ...range,
    });
  }

  static whereOrCurrentMonth(
    other?: FindOptionsWhere<WithCreationDate>,
  ): FindOptionsWhere<WithCreationDate> {
    return {
      ...getCurrentMonthRange().toWhereOptions(),
      ...other,
    };
  }

  override toWhereOptions(): FindOptionsWhere<WithCreationDate> {
    return super.toWhereOptions()!;
  }
}
