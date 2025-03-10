import { TagAlias, TagAliasStatus } from 'src/api';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tag_aliases')
export class TagAliasEntity extends LabelLink {
  constructor(partial?: Partial<TagAliasEntity>) {
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

  @Column({ type: 'int', nullable: true })
  forumPostId: number | null;

  @Column({ type: 'int', nullable: true })
  forumTopicId: number | null;

  @Column({ type: 'int', nullable: true })
  postCount: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'simple-enum', enum: TagAliasStatus })
  status: TagAliasStatus;
}

export class TagAliasLabelEntity extends LabelEntity {
  constructor(value: TagAlias) {
    super({
      id: `/${ItemType.tagAliases}/${value.id}`,
    });
  }
}
