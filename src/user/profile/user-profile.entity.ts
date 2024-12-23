import { UserProfile } from 'src/api';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfileEntity extends CacheLink {
  constructor(partial?: Partial<UserProfileEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'int' })
  level: number;

  @Column({ type: 'text' })
  levelString: string;

  @Column({ type: 'boolean' })
  isBanned: boolean;

  @Column({ type: 'int', nullable: true })
  avatarId: number | null;

  @Column({ type: 'int' })
  baseUploadLimit: number;

  @Column({ type: 'boolean' })
  canApprovePosts: boolean;

  @Column({ type: 'boolean' })
  canUploadFree: boolean;

  @Column({ type: 'int', nullable: true })
  artistVersionCount: number | null;

  @Column({ type: 'int', nullable: true })
  commentCount: number | null;

  @Column({ type: 'int', nullable: true })
  favoriteCount: number | null;

  @Column({ type: 'int', nullable: true })
  flagCount: number | null;

  @Column({ type: 'int', nullable: true })
  forumPostCount: number | null;

  @Column({ type: 'int' })
  noteUpdateCount: number;

  @Column({ type: 'int', nullable: true })
  poolVersionCount: number | null;

  @Column({ type: 'int', nullable: true })
  negativeFeedbackCount: number | null;

  @Column({ type: 'int', nullable: true })
  neutralFeedbackCount: number | null;

  @Column({ type: 'int', nullable: true })
  positiveFeedbackCount: number | null;

  @Column({ type: 'int' })
  postUpdateCount: number;

  @Column({ type: 'int' })
  postUploadCount: number;

  @Column({ type: 'int', nullable: true })
  uploadLimit: number | null;

  @Column({ type: 'int', nullable: true })
  wikiPageVersionCount: number | null;

  @Column({ type: 'text', nullable: true })
  profileAbout: string | null;

  @Column({ type: 'text', nullable: true })
  profileArtinfo: string | null;

  @Column({ type: 'datetime' })
  createdAt: Date;
}

export class UserProfileCacheEntity extends CacheEntity {
  constructor(value: UserProfile) {
    super({
      id: `/${ItemType.userProfiles}/${value.id}`,
      value,
    });
  }
}
