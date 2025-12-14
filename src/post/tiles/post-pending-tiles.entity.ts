import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('post_pending_hourly_tiles')
@Index(['time'])
export class PostPendingTilesEntity {
  constructor(partial?: Partial<PostPendingTilesEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'int', default: 0 })
  count: number;
}

export type PostPendingTilesData = Pick<PostPendingTilesEntity, 'count'>;
