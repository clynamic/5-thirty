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

export class TicketClosedPoint {
  constructor(value: TicketClosedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  closed: number;
}

export class ModSummary {
  constructor(value: ModSummary) {
    Object.assign(this, value);
  }

  userId: number;
  userName?: string;
  userAvatar?: string;
  claimed: number;
  handled: number;
}

export class ReporterSummary {
  constructor(value: ReporterSummary) {
    Object.assign(this, value);
  }

  userId: number;
  userName?: string;
  userAvatar?: string;
  reported: number;
}
