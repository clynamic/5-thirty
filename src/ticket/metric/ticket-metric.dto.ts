import { TicketStatus } from 'src/api';
import { UserHead } from 'src/user/head/user-head.dto';
import { Raw, toRaws } from 'src/common';
import { FindOptionsWhere, In } from 'typeorm';

import { TicketEntity } from '../ticket.entity';

export class TicketStatusSummary {
  constructor(value: TicketStatusSummary) {
    Object.assign(this, value);
  }

  pending: number;
  approved: number;
  partial: number;
}

export class TicketTypeSummaryQuery {
  constructor(value: Raw<TicketTypeSummaryQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  reporterId?: number;

  where(): FindOptionsWhere<TicketEntity> {
    return toRaws({
      claimantId: this.claimantId,
      reporterId: this.reporterId,
    });
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

export class TicketCreatedSeriesQuery {
  constructor(value: Raw<TicketCreatedSeriesQuery>) {
    Object.assign(this, value);
  }

  creatorId?: number;

  where(): FindOptionsWhere<TicketEntity> {
    return toRaws({
      creatorId: this.creatorId,
    });
  }
}

export class TicketClosedSeriesQuery {
  constructor(value: Raw<TicketClosedSeriesQuery>) {
    Object.assign(this, value);
  }

  handlerId?: number;

  where(): FindOptionsWhere<TicketEntity> {
    return toRaws({
      handlerId: this.handlerId,
    });
  }
}

export class TicketActivitySummaryQuery {
  constructor(value: Raw<TicketActivitySummaryQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  reporterId?: number;

  where(): FindOptionsWhere<TicketEntity> {
    return toRaws({
      claimantId: this.claimantId,
      reporterId: this.reporterId,
    });
  }
}

export class TicketAgeSummaryQuery {
  constructor(value: Raw<TicketAgeSummaryQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  status?: TicketStatus[];

  where(): FindOptionsWhere<TicketEntity> {
    return toRaws({
      claimantId: this.claimantId,
      status: this.status ? In(this.status) : undefined,
    });
  }
}

export class TicketAgeSummary {
  constructor(value: Raw<TicketAgeSummary>) {
    Object.assign(this, value);
  }

  oneDay: number;
  threeDays: number;
  oneWeek: number;
  twoWeeks: number;
  oneMonth: number;
  aboveOneMonth: number;
}

export class TicketAgeSeriesPoint extends TicketAgeSummary {
  constructor(value: Raw<TicketAgeSeriesPoint>) {
    super(value);
    Object.assign(this, value);
  }

  date: Date;
}

export class TicketHandlerSummary {
  constructor(value: Raw<TicketHandlerSummary>) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  position: number;
  days: number;
}

export class TicketReporterSummary {
  constructor(value: Raw<TicketReporterSummary>) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  days: number;
}
