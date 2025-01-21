import { PostFlag, PostFlagType } from 'src/api';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('flags')
export class FlagEntity extends LabelLink {
  constructor(partial?: Partial<FlagEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  creatorId: number;

  @Column({ type: 'int' })
  @Index()
  postId: number;

  @Column({ type: 'boolean' })
  isResolved: boolean;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'simple-enum', enum: PostFlagType })
  type: PostFlagType;

  @DateTimeColumn()
  @Index()
  createdAt: Date;

  @DateTimeColumn()
  updatedAt: Date;
}

export class FlagLabelEntity extends LabelEntity {
  constructor(value: PostFlag) {
    super({
      id: `/${ItemType.flags}/${value.id}`,
    });
  }
}
