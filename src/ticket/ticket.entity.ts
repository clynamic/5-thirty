import { Ticket, TicketQtype, TicketStatus } from 'src/api/e621';
import { CacheEntity, CacheLink } from 'src/cache';
import { ManifestType } from 'src/manifest';
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

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  updatedAt: Date;
}

export class TicketCacheEntity extends CacheEntity {
  constructor(value: Ticket) {
    super({
      id: `/${ManifestType.tickets}/${value.id}`,
      value,
    });
  }
}
