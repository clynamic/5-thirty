/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { PostReplacementStatus } from './postReplacementStatus';

/**
 * A post replacement object representing a file replacement request for a post.
 */
export interface PostReplacement {
  /**
   * The ID of the user who approved the replacement, if applicable
   * @nullable
   */
  approver_id?: number | null;
  /** The timestamp when the replacement was created */
  created_at: Date;
  /** The ID of the user who created the replacement */
  creator_id: number;
  /** The file extension of the replacement (e.g., jpg, png, webm) */
  file_ext: string;
  /** The name of the replacement file */
  file_name: string;
  /** The size of the replacement file in bytes */
  file_size: number;
  /** The unique ID of the post replacement */
  id: number;
  /** The height of the replacement image in pixels */
  image_height: number;
  /** The width of the replacement image in pixels */
  image_width: number;
  /** The MD5 hash of the replacement file */
  md5: string;
  /** The ID of the post associated with the replacement */
  post_id: number;
  /** The reason for the replacement request */
  reason: string;
  /** The source URLs for the replacement, separated by newlines */
  source: string;
  /** The current status of the replacement */
  status: PostReplacementStatus;
  /** The timestamp when the replacement was last updated */
  updated_at: Date;
}
