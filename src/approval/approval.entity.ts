import { CacheLink } from 'src/cache';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('approvals')
export class ApprovalEntity extends CacheLink {
  constructor(partial?: Partial<ApprovalEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'date' })
  createdAt: Date;
}
