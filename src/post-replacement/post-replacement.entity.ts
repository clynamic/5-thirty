import { PostReplacement, PostReplacementStatus } from 'src/api/e621';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('post_replacements')
export class PostReplacementEntity extends CacheLink {
  constructor(partial?: Partial<PostReplacementEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'text' })
  fileExt: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'int' })
  imageHeight: number;

  @Column({ type: 'int' })
  imageWidth: number;

  @Column({ type: 'text' })
  md5: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ type: 'simple-enum', enum: PostReplacementStatus })
  status: PostReplacementStatus;

  @Column({ type: 'text' })
  reason: string;
}

export class PostReplacementCacheEntity extends CacheEntity {
  constructor(value: PostReplacement) {
    super({
      id: `/${ItemType.postReplacements}/${value.id}`,
      value,
    });
  }
}
