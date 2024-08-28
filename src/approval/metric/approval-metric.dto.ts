import { PartialDateRange } from 'src/utils';

export class ApprovalCountSummary {
  constructor(value: ApprovalCountSummary) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  total: number;
}

export class ApprovalCountPoint {
  constructor(value: ApprovalCountPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class ApprovalCountSeries {
  constructor(value: ApprovalCountSeries) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  points: ApprovalCountPoint[];
}

export class JanitorSummary {
  constructor(value: JanitorSummary) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  userId: string;
  userName?: string;
  userAvatar?: string;
  total: number;
}
