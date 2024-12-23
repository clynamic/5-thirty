import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A Permit is a computed record that represents that a Post is not in Pending status.
 *
 * This is much like an Approval, but only exists on the Aggregate server.
 * These entities are created because we require a way to track Posts which do inherently not require Approval.
 * Posts that fall into this category are the ones uploaded by users with unlimited upload permissions.
 */
@Entity('permits')
export class PermitEntity {
  constructor(partial?: Partial<PermitEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn('increment')
  id: number;

  /**
   * The user who has uploaded the Post.
   */
  @Column({ type: 'int' })
  userId: number;

  /**
   * The Post that this Permit is for.
   */
  @Column({ type: 'int' })
  @Index()
  postId: number;

  /**
   * The date and time when this Permit was created.
   *
   * This is usually whenever the server runs a sync job.
   */
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
