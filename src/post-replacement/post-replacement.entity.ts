import { PostReplacement, PostReplacementStatus } from 'src/api/e621';
import { DateTimeColumn } from 'src/common';
import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('post_replacements')
export class PostReplacementEntity extends LabelLink {
  constructor(partial?: Partial<PostReplacementEntity>) {
    super();
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @DateTimeColumn()
  createdAt: Date;

  @Column({ type: 'int' })
  creatorId: number;

  @DateTimeColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  approverId: number | null;

  @Column({ type: 'text' })
  fileExt: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'int' })
  imageHeight: number;

  @Column({ type: 'int' })
  imageWidth: number;

  @Column({ type: 'text' })
  md5: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ type: 'simple-enum', enum: PostReplacementStatus })
  status: PostReplacementStatus;

  @Column({ type: 'text' })
  reason: string;
}

export class PostReplacementLabelEntity extends LabelEntity {
  constructor(value: PostReplacement) {
    super({
      id: `/${ItemType.postReplacements}/${value.id}`,
    });
  }
}
