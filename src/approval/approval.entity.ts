import { Approval } from 'src/api/e621';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('approvals')
export class ApprovalEntity extends CacheLink {
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

export class ApprovalCacheEntity extends CacheEntity {
  constructor(value: Approval) {
    super({
      id: `/${ItemType.approvals}/${value.id}`,
      value,
    });
  }
}
