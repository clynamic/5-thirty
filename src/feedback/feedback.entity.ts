import { UserFeedback, UserFeedbackCategory } from 'src/api';
import { CacheEntity, CacheLink, ItemType } from 'src/cache/cache.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('feedbacks')
export class FeedbackEntity extends CacheLink {
  constructor(partial?: Partial<FeedbackEntity>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'simple-enum', enum: UserFeedbackCategory })
  category: UserFeedbackCategory;

  @Column({ type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'int' })
  updaterId: number;

  @Column({ type: 'boolean' })
  isDeleted: boolean;
}

export class FeedbackCacheEntity extends CacheEntity {
  constructor(value: UserFeedback) {
    super({
      id: `/${ItemType.feedbacks}/${value.id}`,
      value,
    });
  }
}
