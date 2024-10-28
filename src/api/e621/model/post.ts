/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { File } from './file';
import type { Flags } from './flags';
import type { PostRating } from './postRating';
import type { Preview } from './preview';
import type { Relationships } from './relationships';
import type { Sample } from './sample';
import type { Score } from './score';
import type { Tags } from './tags';

export interface Post {
  /**
   * The ID of the user who approved the post, if applicable
   * @nullable
   */
  approver_id?: number | null;
  /** The sequence number of changes to the post */
  change_seq: number;
  /** The number of comments on the post */
  comment_count: number;
  /** The time when the post was created */
  created_at: Date;
  /** The description of the post */
  description: string;
  /**
   * The duration of the post, if applicable
   * @nullable
   */
  duration?: number | null;
  /** The number of times the post has been favorited */
  fav_count: number;
  file: File;
  flags: Flags;
  /** Whether the post has any notes attached */
  has_notes: boolean;
  /** The unique ID of the post */
  id: number;
  /** Whether the post is favorited by the current user */
  is_favorited?: boolean;
  /** An array of tags that are locked */
  locked_tags: string[];
  /** An array of pool IDs associated with the post */
  pools: number[];
  preview: Preview;
  /** The rating of the post (e.g., safe, questionable, explicit) */
  rating: PostRating;
  relationships: Relationships;
  sample: Sample;
  score: Score;
  /** An array of sources for the post */
  sources: string[];
  tags: Tags;
  /** The last time the post was updated */
  updated_at: Date;
  /** The ID of the user who uploaded the post */
  uploader_id: number;
}
