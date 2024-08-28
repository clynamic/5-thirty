import { PartialDateRange } from 'src/utils';

export class TicketStatusSummary {
  constructor(value: TicketStatusSummary) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  pending: number;
  approved: number;
  partial: number;
}
export class TicketTypeSummary {
  constructor(value: TicketTypeSummary) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
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

export class TicketOpenSeries {
  constructor(value: TicketOpenSeries) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  points: TicketOpenPoint[];
}

export class TicketClosedPoint {
  constructor(value: TicketClosedPoint) {
    Object.assign(this, value);
  }

  date: Date;
  closed: number;
}

export class TicketClosedSeries {
  constructor(value: TicketClosedSeries) {
    Object.assign(this, value);
  }

  range: PartialDateRange;
  points: TicketClosedPoint[];
}

export class ModSummary {
  constructor(value: ModSummary) {
    Object.assign(this, value);
  }

  userId: string;
  userName?: string;
  userAvatar?: string;
  claimed: number;
  handled: number;
}

export class ReporterSummary {
  constructor(value: ReporterSummary) {
    Object.assign(this, value);
  }

  userId: string;
  userName?: string;
  userAvatar?: string;
  reported: number;
}
