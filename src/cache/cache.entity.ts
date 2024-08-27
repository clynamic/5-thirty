import {
  Entity,
  Column,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';

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

  @PrimaryGeneratedColumn('increment')
  id: number;

  @UpdateDateColumn({ type: 'date' })
  refreshedAt: Date;

  @Column({ type: 'json' })
  value: CacheValue;
}

export class CacheLink {
  @OneToOne(() => CacheEntity, { eager: false, cascade: true })
  @JoinColumn({ name: 'cache_id' })
  cache: CacheEntity | null;
}
