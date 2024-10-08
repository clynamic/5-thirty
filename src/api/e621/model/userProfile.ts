/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */

/**
 * A detailed representation of a user.
 */
export interface UserProfile {
  /** Number of artist versions created by the user */
  artist_version_count?: number;
  /** The ID of the user's avatar image */
  avatar_id?: number;
  /** The base upload limit for the user */
  base_upload_limit: number;
  /** Whether the user can approve posts */
  can_approve_posts: boolean;
  /** Whether the user can upload without restrictions */
  can_upload_free: boolean;
  /** Number of comments made by the user */
  comment_count?: number;
  /** The timestamp when the user account was created */
  created_at: Date;
  /** Number of favorites added by the user */
  favorite_count?: number;
  /** Number of flags made by the user */
  flag_count?: number;
  /** Number of forum posts created by the user */
  forum_post_count?: number;
  /** The unique ID of the user */
  id: number;
  /** Whether the user is banned */
  is_banned: boolean;
  /** The user's access level (numerical) */
  level: number;
  /** The user's access level (textual description) */
  level_string: string;
  /** The username of the user */
  name: string;
  /** Number of negative feedbacks received by the user */
  negative_feedback_count?: number;
  /** Number of neutral feedbacks received by the user */
  neutral_feedback_count?: number;
  /** Number of note updates made by the user */
  note_update_count: number;
  /** Number of pool versions created by the user */
  pool_version_count?: number;
  /** Number of positive feedbacks received by the user */
  positive_feedback_count?: number;
  /** Number of post updates made by the user */
  post_update_count: number;
  /** Number of posts uploaded by the user */
  post_upload_count: number;
  /** The user's "About" profile section */
  profile_about?: string;
  /** The user's art information profile section */
  profile_artinfo?: string;
  /** The user's current upload limit */
  upload_limit?: number;
  /** Number of wiki page versions created by the user */
  wiki_page_version_count?: number;
}
