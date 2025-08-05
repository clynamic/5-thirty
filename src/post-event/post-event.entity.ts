import { PostEvent, PostEventAction } from 'src/api';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity(ItemType.postEvents)
@Index(['action', 'createdAt'])
@Index(['creatorId', 'action', 'createdAt'])
export class PostEventEntity extends LabelLink {
  constructor(partial: Partial<PostEventEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'simple-enum', enum: PostEventAction })
  action: PostEventAction;

  @DateTimeColumn()
  createdAt: Date;
}

export class PostEventLabelEntity extends LabelEntity {
  constructor(value: PostEvent) {
    super({
      id: `/${ItemType.postEvents}/${value.id}`,
    });
  }
}
