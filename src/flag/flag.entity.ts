import { PostFlag, PostFlagType } from 'src/api';
import { CacheEntity, CacheLink } from 'src/cache/cache.entity';
import { ManifestType } from 'src/manifest/manifest.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('flags')
export class FlagEntity extends CacheLink {
  constructor(partial?: Partial<FlagEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'boolean' })
  isResolved: boolean;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'simple-enum', enum: PostFlagType })
  type: PostFlagType;

  @Column({ type: 'datetime' })
  @Index()
  createdAt: Date;

  @Column({ type: 'datetime' })
  updatedAt: Date;
}

export class FlagCacheEntity extends CacheEntity {
  constructor(value: PostFlag) {
    super({
      id: `/${ManifestType.flags}/${value.id}`,
      value,
    });
  }
}
