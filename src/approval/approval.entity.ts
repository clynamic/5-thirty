import { Approval } from 'src/api/e621';
import { CacheEntity, CacheLink } from 'src/cache';
import { ManifestType } from 'src/manifest';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('approvals')
export class ApprovalEntity extends CacheLink {
  constructor(partial?: Partial<ApprovalEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'datetime' })
  createdAt: Date;
}

export class ApprovalCacheEntity extends CacheEntity {
  constructor(value: Approval) {
    super({
      id: `/${ManifestType.approvals}/${value.id}`,
      value,
    });
  }
}
