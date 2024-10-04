import { UserHead } from 'src/user/head/user-head.dto';
import { Raw } from 'src/utils';

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

export class TicketCreatedUserQuery {
  constructor(value: Raw<TicketCreatedUserQuery>) {
    Object.assign(this, value);
  }
}

export class TicketClosedUserQuery {
  constructor(value: Raw<TicketClosedUserQuery>) {
    Object.assign(this, value);
  }

  handlerId?: number;
}

export class TicketActivityUserQuery {
  constructor(value: Raw<TicketActivityUserQuery>) {
    Object.assign(this, value);
  }

  claimantId?: number;
  reporterId?: number;
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
