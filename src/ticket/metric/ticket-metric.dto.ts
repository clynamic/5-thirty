import { UserHead } from 'src/user/head/user-head.dto';
import { Raw } from 'src/utils';
import { FindOptionsWhere } from 'typeorm';

import { TicketEntity } from '../ticket.entity';

export class TicketStatusSummary {
  constructor(value: TicketStatusSummary) {
    Object.assign(this, value);
  }

  pending: number;
  approved: number;
  partial: number;
}

export class TicketTypeSummaryUserQuery {
  constructor(value: Raw<TicketTypeSummaryUserQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  reporterId?: number;

  toWhereOptions(): FindOptionsWhere<TicketEntity> {
    return {
      ...(this.claimantId && { claimantId: this.claimantId }),
      ...(this.reporterId && { reporterId: this.reporterId }),
    };
  }
}

export class TicketTypeSummary {
  constructor(value: TicketTypeSummary) {
    Object.assign(this, value);
  }

  user: number;
  comment: number;
  forum: number;
  blip: number;
  wiki: number;
  pool: number;
  set: number;
  post: number;
  dmail: number;
}

export class TicketOpenPoint {
  constructor(value: TicketOpenPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class TicketCreatedUserQuery {
  constructor(value: Raw<TicketCreatedUserQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;

  toWhereOptions(): FindOptionsWhere<TicketEntity> {
    return {
      ...(this.creatorId && { creatorId: this.creatorId }),
    };
  }
}

export class TicketCreatedPoint {
  constructor(value: TicketCreatedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class TicketClosedUserQuery {
  constructor(value: Raw<TicketClosedUserQuery>) {
    Object.assign(this, value);
  }

  handlerId?: number;

  toWhereOptions(): FindOptionsWhere<TicketEntity> {
    return {
      ...(this.handlerId && { handlerId: this.handlerId }),
    };
  }
}

export class TicketClosedPoint {
  constructor(value: TicketClosedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class TicketActivityUserQuery {
  constructor(value: Raw<TicketActivityUserQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  reporterId?: number;

  toWhereOptions(): FindOptionsWhere<TicketEntity> {
    return {
      ...(this.claimantId && { claimantId: this.claimantId }),
      ...(this.reporterId && { reporterId: this.reporterId }),
    };
  }
}

export class TicketActivityPoint {
  constructor(value: TicketActivityPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class TicketAgeGroup {
  constructor(value: TicketAgeGroup) {
    Object.assign(this, value);
  }

  oneDay: number;
  threeDays: number;
  oneWeek: number;
  twoWeeks: number;
  oneMonth: number;
  aboveOneMonth: number;
}

export class TicketAgeSeriesPoint {
  constructor(value: TicketAgeSeriesPoint) {
    Object.assign(this, value);
  }

  date: Date;
  groups: TicketAgeGroup;
}

export class TicketAgeSummary {
  constructor(value: TicketAgeSummary) {
    Object.assign(this, value);
  }

  groups: TicketAgeGroup;
}

export class TicketHandlerSummary {
  constructor(value: TicketHandlerSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  position: number;
  days: number;
}

export class TicketReporterSummary {
  constructor(value: TicketReporterSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  days: number;
}
