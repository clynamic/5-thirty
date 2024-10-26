import { UserHead } from 'src/user/head/user-head.dto';
import { Raw } from 'src/common';
import { FindOptionsWhere } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';

export class ApprovalCountSummary {
  constructor(value: ApprovalCountSummary) {
    Object.assign(this, value);
  }

  total: number;
}

export class ApprovalCountSeriesQuery {
  constructor(value: Raw<ApprovalCountSeriesQuery>) {
    Object.assign(this, value);
  }

  userId: number;

  where(): FindOptionsWhere<ApprovalEntity> {
    return { userId: this.userId };
  }
}

export class ApprovalActivitySummaryQuery {
  constructor(value: Raw<ApprovalActivitySummaryQuery>) {
    Object.assign(this, value);
  }

  userId: number;

  where(): FindOptionsWhere<ApprovalEntity> {
    return { userId: this.userId };
  }
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
