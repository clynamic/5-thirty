import { UserHead } from 'src/user/head/user-head.dto';

export class ApprovalCountSummary {
  constructor(value: ApprovalCountSummary) {
    Object.assign(this, value);
  }

  total: number;
}

export class ApprovalCountPoint {
  constructor(value: ApprovalCountPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class ApproverSummary {
  constructor(value: ApproverSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  days: number;
}
