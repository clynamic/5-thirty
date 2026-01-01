import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('upload_hourly_tiles')
@Index(['time'])
export class UploadTilesEntity {
  constructor(partial?: Partial<UploadTilesEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'timestamptz' })
  time: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'int', default: 0 })
  count: number;
}

export type UploadTilesData = Pick<UploadTilesEntity, 'count'>;
