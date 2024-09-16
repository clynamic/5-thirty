import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import {
  Between,
  FindOperator,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

import {
  getCurrentMonthRange,
  getDateRangeString,
  WithCreationDate,
} from './range';
import { Raw } from './raw';

/**
 * A range of dates, inclusive on both ends.
 * May be missing one or both ends.
 */
export class PartialDateRange {
  constructor(value?: Raw<PartialDateRange>) {
    if (value) {
      Object.assign(this, value);
    }
  }

  /**
   * start date for the range, inclusive.
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  /**
   * end date for the range, inclusive
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  static currentMonth(): DateRange {
    return getCurrentMonthRange();
  }

  toFindOptions(): FindOperator<Date> | undefined {
    return this.startDate
      ? this.endDate
        ? Between(this.startDate, this.endDate)
        : MoreThanOrEqual(this.startDate)
      : this.endDate
        ? LessThanOrEqual(this.endDate)
        : undefined;
  }

  toWhereOptions(): FindOptionsWhere<WithCreationDate> | undefined {
    return {
      createdAt: this.toFindOptions(),
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
  constructor(value: Raw<DateRange>) {
    super(value);
  }

  @IsDate()
  @Type(() => Date)
  override startDate: Date;

  @IsDate()
  @Type(() => Date)
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

  override toFindOptions(): FindOperator<Date> {
    return super.toFindOptions()!;
  }

  override toWhereOptions(): FindOptionsWhere<WithCreationDate> {
    return super.toWhereOptions()!;
  }
}
