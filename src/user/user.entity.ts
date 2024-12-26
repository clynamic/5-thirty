import { User } from 'src/api/e621';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserEntity extends LabelLink {
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

export class UserCacheEntity extends LabelEntity {
  constructor(value: User) {
    super({
      id: `/${ItemType.users}/${value.id}`,
    });
  }
}
