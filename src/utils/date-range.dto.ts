import {
  FindOperator,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import {
  getCurrentMonthRange,
  getDateRangeString,
  WithCreationDate,
} from './range';

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

  toCreatedAtRange(): FindOptionsWhere<WithCreationDate> | undefined {
    return { createdAt: this.toFindOperator() };
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

  static orCurrentMonth(range?: PartialDateRange): DateRange {
    return new DateRange({
      ...range,
      ...(!range?.startDate && !range?.endDate && getCurrentMonthRange()),
    });
  }

  toCreatedAtRange(): FindOptionsWhere<WithCreationDate> {
    return { createdAt: this.toFindOperator() };
  }

  startDate: Date;

  endDate: Date;
}
