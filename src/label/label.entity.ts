import { UpdateDateTimeColumn } from 'src/common';
import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

export enum ItemType {
  tickets = 'tickets',
  posts = 'posts',
  users = 'users',
  userProfiles = 'user_profiles',
  flags = 'flags',
  feedbacks = 'feedbacks',
  postVersions = 'post_versions',
  postReplacements = 'post_replacements',
  postEvents = 'post_events',
  modActions = 'mod_actions',
  bulkUpdateRequests = 'bulk_update_requests',
  tagAliases = 'tag_aliases',
  tagImplications = 'tag_implications',
  permits = 'permits',
}

export const getItemName = (type: ItemType) => {
  return type
    .split('_')
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(' ');
};

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

  @UpdateDateTimeColumn()
  refreshedAt: Date;
}

export class LabelLink {
  @OneToOne(() => LabelEntity, { eager: false, cascade: true })
  @JoinColumn({ name: 'label_id' })
  label: LabelEntity;
}
