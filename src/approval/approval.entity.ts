import { Approval } from 'src/api/e621';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('approvals')
export class ApprovalEntity extends LabelLink {
  constructor(partial?: Partial<ApprovalEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  @Index()
  postId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'datetime' })
  @Index()
  createdAt: Date;
}

export class ApprovalCacheEntity extends LabelEntity {
  constructor(value: Approval) {
    super({
      id: `/${ItemType.approvals}/${value.id}`,
    });
  }
}
