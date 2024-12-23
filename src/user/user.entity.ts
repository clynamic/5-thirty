import { User } from 'src/api/e621';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserEntity extends CacheLink {
  constructor(partial?: Partial<UserEntity>) {
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

  @Column({ type: 'datetime' })
  createdAt: Date;
}

export class UserCacheEntity extends CacheEntity {
  constructor(value: User) {
    super({
      id: `/${ItemType.users}/${value.id}`,
      value,
    });
  }
}
