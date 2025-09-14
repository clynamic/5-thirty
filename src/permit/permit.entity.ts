import { ItemType, LabelEntity, LabelLink } from 'src/label/label.entity';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * A Permit represents a Post that does not require approval,
 * because it was uploaded by a user with unlimited upload permissions.
 *
 * This is not a model that exists upstream. Instead, it is derived from Post entities directly.
 */
@Entity(ItemType.permits)
export class PermitEntity extends LabelLink {
  constructor(partial?: Partial<PermitEntity>) {
    super();
    Object.assign(this, partial);
  }

  /**
   * The ID of the Post that is permitted.
   */
  @PrimaryColumn({ type: 'int' })
  id: number;

  /**
   * The user who uploaded the Post.
   */
  @Column({ type: 'int' })
  @Index()
  uploaderId: number;

  /**
   * The date and time when this Post was created.
   */
  @Column({ type: 'timestamptz' })
  @Index()
  createdAt: Date;
}

export class PermitLabelEntity extends LabelEntity {
  constructor(postId: number) {
    super({
      id: `/${ItemType.permits}/${postId}`,
    });
  }
}
