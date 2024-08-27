import { TicketQtype, TicketStatus } from 'src/api/e621';
import { CacheLink } from 'src/cache';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tickets')
export class TicketEntity extends CacheLink {
  constructor(partial?: Partial<TicketEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'int', nullable: true })
  claimantId: number | null;

  @Column({ type: 'int', nullable: true })
  handlerId: number;

  @Column({ type: 'int', nullable: true })
  accusedId: number | null;

  @Column({ type: 'int', nullable: true })
  dispId: number | null;

  @Column({ type: 'text', enum: TicketQtype })
  qtype: TicketQtype;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  reportReason: string | null;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'text', enum: TicketStatus })
  status: TicketStatus;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'date' })
  updatedAt: Date;
}

export class TicketQuery {
  /**
   * Start date for the query
   */
  start?: Date;
  /**
   * End date for the query
   */
  end?: Date;
}
