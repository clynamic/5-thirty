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
 * Item types that are "porous" (don't have ID contiguity).
 * This might be a result of either how we sync data or what data is available
 * due to permissions or true deletions.
 */
export const POROUS_ITEM_TYPES: ItemType[] = [
  ItemType.feedbacks,
  ItemType.tagAliases,
  ItemType.tagImplications,
  ItemType.modActions,
  ItemType.postVersions,
  ItemType.permits,
];

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
