import { FindManyOptions, FindOptionsWhere } from 'typeorm';

import { PartialDateRange } from './date-range.dto';
import { WithCreationDate } from './range';

export class SummaryQuery extends PartialDateRange {
  constructor(partial?: Partial<SummaryQuery>) {
    super(partial);
  }

  limit?: number;

  override toWhereOptions():
    | (FindOptionsWhere<WithCreationDate> & FindManyOptions<WithCreationDate>)
    | undefined {
    return {
      ...super.toWhereOptions(),
      take: this.limit,
    };
  }
}
