import { BulkUpdateRequest, BulkUpdateRequestStatus } from 'src/api';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity(ItemType.bulkUpdateRequests)
export class BulkUpdateRequestEntity extends LabelLink {
  constructor(partial?: Partial<BulkUpdateRequestEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'int', nullable: true })
  forumTopicId: number | null;

  @Column({ type: 'int', nullable: true })
  forumPostId: number | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  script: string;

  @Column({ type: 'simple-enum', enum: BulkUpdateRequestStatus })
  status: BulkUpdateRequestStatus;
}

export class BulkUpdateRequestLabelEntity extends LabelEntity {
  constructor(value: BulkUpdateRequest) {
    super({
      id: `/${ItemType.bulkUpdateRequests}/${value.id}`,
    });
  }
}
