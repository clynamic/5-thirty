import { PostVersion, PostVersionRating } from 'src/api/e621';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity(ItemType.postVersions)
@Index(['version', 'updatedAt'])
export class PostVersionEntity extends LabelLink {
  constructor(partial?: Partial<PostVersionEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean' })
  descriptionChanged: boolean;

  @Column({ type: 'simple-enum', enum: PostVersionRating })
  rating: PostVersionRating;

  @Column({ type: 'boolean' })
  ratingChanged: boolean;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'boolean' })
  sourceChanged: boolean;

  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'boolean' })
  parentChanged: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'json', nullable: true })
  addedLockedTags: string[] | null;

  @Column({ type: 'json', nullable: true })
  addedTags: string[] | null;

  @Column({ type: 'text', nullable: true })
  lockedTags: string | null;

  @Column({ type: 'text', nullable: true })
  obsoleteAddedTags: string | null;

  @Column({ type: 'text', nullable: true })
  obsoleteRemovedTags: string | null;

  @Column({ type: 'json', nullable: true })
  removedLockedTags: string[] | null;

  @Column({ type: 'json', nullable: true })
  removedTags: string[] | null;

  @Column({ type: 'text', nullable: true })
  tags: string | null;

  @Column({ type: 'text', nullable: true })
  unchangedTags: string | null;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'int' })
  updaterId: number;

  @Column({ type: 'text' })
  updaterName: string;

  @Column({ type: 'int' })
  version: number;
}

export class PostVersionLabelEntity extends LabelEntity {
  constructor(value: PostVersion) {
    super({
      id: `/${ItemType.postVersions}/${value.id}`,
    });
  }
}
