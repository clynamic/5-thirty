import { UserHead } from 'src/user/head/user-head.dto';

export class TicketStatusSummary {
  constructor(value: TicketStatusSummary) {
    Object.assign(this, value);
  }

  pending: number;
  approved: number;
  partial: number;
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

export class TicketCreatedPoint {
  constructor(value: TicketCreatedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  count: number;
}

export class TicketClosedPoint {
  constructor(value: TicketClosedPoint) {
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

export class TicketerSummary {
  constructor(value: TicketerSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  position: number;
  days: number;
}

export class ReporterSummary {
  constructor(value: ReporterSummary) {
    Object.assign(this, value);
  }

  userId: number;
  head?: UserHead;
  total: number;
  days: number;
}
