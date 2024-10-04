import { UserHead } from 'src/user/head/user-head.dto';
import { Raw } from 'src/utils';

export class ApprovalCountSummary {
  constructor(value: ApprovalCountSummary) {
    Object.assign(this, value);
  }

  total: number;
}

export class ApprovalCountUserQuery {
  constructor(value: Raw<ApprovalCountUserQuery>) {
    Object.assign(this, value);
  }

  userId: number;
}

export class ApprovalActivityUserQuery {
  constructor(value: Raw<ApprovalActivityUserQuery>) {
    Object.assign(this, value);
  }

  userId: number;
}

export class ApproverSummary {
  constructor(value: ApproverSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  position: number;
  days: number;
}
