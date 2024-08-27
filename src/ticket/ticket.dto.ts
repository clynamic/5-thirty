import { TicketQtype } from 'src/api/e621';

export class Ticket {
  id: number;
  creatorId: number;
  claimantId: number | null;
  handlerId: number;
  accusedId: number | null;
  dispId: number | null;
  qtype: TicketQtype;
  reason: string;
  reportReason: string | null;
  response: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
