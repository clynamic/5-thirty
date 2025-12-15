import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('post_lifecycle')
@Index(['uploadedAt'])
@Index(['approvedAt'])
@Index(['deletedAt'])
@Index(['permittedAt'])
export class PostLifecycleEntity {
  constructor(partial?: Partial<PostLifecycleEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  postId: number;

  @Column({ type: 'timestamptz', nullable: true })
  uploadedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  permittedAt: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
