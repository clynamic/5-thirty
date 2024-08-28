import { PartialDateRange } from 'src/utils';

export class TicketStatusSummary {
  constructor(partial?: Partial<TicketStatusSummary>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
  range: PartialDateRange;
  pending: number;
  approved: number;
  partial: number;
}

export class TicketTypeSummary {
  constructor(partial?: Partial<TicketTypeSummary>) {
    if (partial) {
      Object.assign(this, partial);
    }
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
  constructor(partial?: Partial<TicketOpenPoint>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  date: Date;
  count: number;
}

export class TicketOpenSeries {
  constructor(partial?: Partial<TicketOpenSeries>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  range: PartialDateRange;
  points: TicketOpenPoint[];
}

export class TicketClosedPoint {
  constructor(partial?: Partial<TicketClosedPoint>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  date: Date;
  closed: number;
}

export class TicketClosedSeries {
  constructor(partial?: Partial<TicketClosedSeries>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  range: PartialDateRange;
  points: TicketClosedPoint[];
}

export class ModSummary {
  constructor(partial?: Partial<ModSummary>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  userId: string;
  userName?: string;
  userAvatar?: string;
  claimed: number;
  handled: number;
}

export class ReporterSummary {
  constructor(partial?: Partial<ReporterSummary>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  userId: string;
  userName?: string;
  userAvatar?: string;
  reported: number;
}
