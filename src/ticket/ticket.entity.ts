import { Ticket, TicketQtype, TicketStatus } from 'src/api/e621';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity(ItemType.tickets)
export class TicketEntity extends LabelLink {
  constructor(partial?: Partial<TicketEntity>) {
    super();
    Object.assign(this, partial);
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

  @DateTimeColumn()
  @Index()
  createdAt: Date;

  @DateTimeColumn()
  updatedAt: Date;
}

export class TicketLabelEntity extends LabelEntity {
  constructor(value: Ticket) {
    super({
      id: `/${ItemType.tickets}/${value.id}`,
    });
  }
}
