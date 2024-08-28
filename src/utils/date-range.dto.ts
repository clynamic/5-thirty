import {
  FindOperator,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { getCurrentMonthRange, getDateRangeString } from './range';

export class PartialDateRange {
  constructor(partial?: Partial<PartialDateRange>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static currentMonth(): DateRange {
    return getCurrentMonthRange();
  }

  toFindOperator(): FindOperator<Date> | undefined {
    return this.startDate
      ? this.endDate
        ? Between(this.startDate, this.endDate)
        : MoreThanOrEqual(this.startDate)
      : this.endDate
        ? LessThanOrEqual(this.endDate)
        : undefined;
  }

  toRangeString(): string {
    return getDateRangeString(this);
  }

  /**
   * start date for the range, inclusive.
   */
  startDate?: Date;

  /**
   * end date for the range, inclusive
   */
  endDate?: Date;
}

export class DateRange extends PartialDateRange {
  constructor(partial?: Partial<DateRange>) {
    super(partial);
  }

  startDate: Date;

  endDate: Date;
}
