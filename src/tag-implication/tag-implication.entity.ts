import { TagImplication, TagImplicationStatus } from 'src/api';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity(ItemType.tagImplications)
export class TagImplicationEntity extends LabelLink {
  constructor(partial?: Partial<TagImplicationEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @DateTimeColumn()
  createdAt: Date;

  @DateTimeColumn()
  updatedAt: Date;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'text' })
  antecedentName: string;

  @Column({ type: 'text' })
  consequentName: string;

  @Column({ type: 'simple-array', nullable: true })
  descendantNames: string[] | null;

  @Column({ type: 'int', nullable: true })
  forumPostId: number | null;

  @Column({ type: 'int', nullable: true })
  forumTopicId: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'simple-enum', enum: TagImplicationStatus })
  status: TagImplicationStatus;
}

export class TagImplicationLabelEntity extends LabelEntity {
  constructor(value: TagImplication) {
    super({
      id: `/${ItemType.tagImplications}/${value.id}`,
    });
  }
}
