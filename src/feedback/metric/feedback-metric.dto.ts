import { Raw, toRaws } from 'src/common';
import { FindOptionsWhere } from 'typeorm';

import { FeedbackEntity } from '../feedback.entity';

export class FeedbackTypeCount {
  constructor(value: Raw<FeedbackTypeCount>) {
    Object.assign(this, value);
  }

  negative: number;
  neutral: number;
  positive: number;
}

export class FeedbackTypeSeriesPoint extends FeedbackTypeCount {
  constructor(value: Raw<FeedbackTypeSeriesPoint>) {
    super(value);
    Object.assign(this, value);
  }

  date: Date;
}

export class FeedbackTypeQuery {
  constructor(value: Raw<FeedbackTypeQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;
  userId?: number;

  where(): FindOptionsWhere<FeedbackEntity> {
    return toRaws({
      creatorId: this.creatorId,
      userId: this.userId,
    });
  }
}
