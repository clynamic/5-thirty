import { UserHead } from 'src/user/head/user-head.dto';
import { Raw } from 'src/utils';
import { FindOptionsWhere } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';

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

  toWhereOptions(): FindOptionsWhere<ApprovalEntity> {
    return {
      ...(this.userId && { userId: this.userId }),
    };
  }
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
  position: number;
  days: number;
}
