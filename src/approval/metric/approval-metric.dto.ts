import { Raw } from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { UserHead } from 'src/user/head/user-head.dto';
import { FindOptionsWhere } from 'typeorm';

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

  where(): FindOptionsWhere<PostEventEntity> {
    return { creatorId: this.userId };
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
