import { Approval } from 'src/api/e621';
import { CacheEntity, CacheLink } from 'src/cache/cache.entity';
import { ManifestType } from 'src/manifest/manifest.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

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
  @Index()
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
