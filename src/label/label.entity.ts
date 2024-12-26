import {
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ItemType {
  approvals = 'approvals',
  tickets = 'tickets',
  posts = 'posts',
  users = 'users',
  userProfiles = 'user_profiles',
  flags = 'flags',
  feedbacks = 'feedbacks',
  postVersions = 'post_versions',
  postReplacements = 'post_replacements',
  modActions = 'mod_actions',
}

/**
 * A label, like a shipping label,
 * stores metadata about an entity we have synced from upstream.
 *
 * Its ID usually resembles the path to the entity in the upstream API.
 */
@Entity('labels')
export class LabelEntity {
  constructor(partial?: Partial<LabelEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn({ type: 'text' })
  id: string;

  @UpdateDateColumn({ type: 'datetime' })
  refreshedAt: Date;
}

export class LabelLink {
  @OneToOne(() => LabelEntity, { eager: false, cascade: true })
  @JoinColumn({ name: 'label_id' })
  cache: LabelEntity;
}
