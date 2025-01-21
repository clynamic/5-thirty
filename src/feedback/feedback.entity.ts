import { UserFeedback, UserFeedbackCategory } from 'src/api';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('feedbacks')
export class FeedbackEntity extends LabelLink {
  constructor(partial?: Partial<FeedbackEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  creatorId: number;

  @DateTimeColumn()
  createdAt: Date;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'simple-enum', enum: UserFeedbackCategory })
  category: UserFeedbackCategory;

  @DateTimeColumn()
  updatedAt: Date;

  @Column({ type: 'int' })
  updaterId: number;

  @Column({ type: 'boolean' })
  isDeleted: boolean;
}

export class FeedbackLabelEntity extends LabelEntity {
  constructor(value: UserFeedback) {
    super({
      id: `/${ItemType.feedbacks}/${value.id}`,
    });
  }
}
