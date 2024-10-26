import { Raw } from 'src/common';

export class FeedbackTypeSummary {
  constructor(value: Raw<FeedbackTypeSummary>) {
    Object.assign(this, value);
  }

  negative: number;
  neutral: number;
  positive: number;
}

export class FeedbackCountGroup {
  constructor(value: Raw<FeedbackCountGroup>) {
    Object.assign(this, value);
  }

  negative: number;
  neutral: number;
  positive: number;
}

export class FeedbackCountSeriesPoint {
  constructor(value: Raw<FeedbackCountSeriesPoint>) {
    Object.assign(this, value);
  }

  date: Date;
  groups: FeedbackCountGroup;
}
