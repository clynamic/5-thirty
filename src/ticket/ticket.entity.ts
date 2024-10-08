import { Ticket, TicketQtype, TicketStatus } from 'src/api/e621';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

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

  @Column({ type: 'simple-enum', enum: TicketQtype })
  qtype: TicketQtype;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  reportReason: string | null;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'simple-enum', enum: TicketStatus })
  @Index()
  status: TicketStatus;

  @Column({ type: 'datetime' })
  @Index()
  createdAt: Date;

  @Column({ type: 'datetime' })
  updatedAt: Date;
}

export class TicketCacheEntity extends CacheEntity {
  constructor(value: Ticket) {
    super({
      id: `/${ItemType.tickets}/${value.id}`,
      value,
    });
  }
}
