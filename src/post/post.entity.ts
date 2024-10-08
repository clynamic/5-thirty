import { Post, PostRating, Tags } from 'src/api/e621';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('posts')
export class PostEntity extends CacheLink {
  constructor(partial?: Partial<PostEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static fromPost(value: Post): PostEntity {
    return new PostEntity({
      id: value.id,
      createdAt: value.created_at,
      updatedAt: value.updated_at,
      file: value.file.url,
      preview: value.preview.url,
      sample: value.sample.url,
      extension: value.file.ext,
      rating: value.rating,
      favorites: value.fav_count,
      score: value.score.total,
      description: value.description,
      uploaderId: value.uploader_id,
      approverId: value.approver_id,
      tags: value.tags,
      deleted: value.flags.deleted,
      cache: new PostCacheEntity(value),
    });
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  file: string | null;

  @Column({ type: 'text', nullable: true })
  preview: string | null;

  @Column({ type: 'text', nullable: true })
  sample: string | null;

  @Column({ type: 'text' })
  extension: string;

  @Column({ type: 'simple-enum', enum: PostRating })
  rating: PostRating;

  @Column({ type: 'int' })
  favorites: number;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  uploaderId: number;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'json' })
  tags: Tags;

  @Column({ type: 'boolean' })
  deleted: boolean;
}

export class PostCacheEntity extends CacheEntity {
  constructor(value: Post) {
    super({
      id: `/${ItemType.posts}/${value.id}`,
      value,
    });
  }
}
