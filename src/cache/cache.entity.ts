import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemType {
  approvals = 'approvals',
  tickets = 'tickets',
  posts = 'posts',
  users = 'users',
  userProfiles = 'user_profiles',
  flags = 'flags',
  feedbacks = 'feedbacks',
}

export interface CacheValue {
  [key: string]: any;
}

@Entity('caches')
export class CacheEntity {
  constructor(partial?: Partial<CacheEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'text' })
  id: string;

  @UpdateDateColumn({ type: 'datetime' })
  refreshedAt: Date;

  @Column({ type: 'json' })
  value: CacheValue;
}

export class CacheLink {
  @OneToOne(() => CacheEntity, { eager: false, cascade: true })
  @JoinColumn({ name: 'cache_id' })
  cache: CacheEntity;
}
