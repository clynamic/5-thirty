/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetUserFeedbacksSearchCategory } from './getUserFeedbacksSearchCategory';
import type { GetUserFeedbacksSearchDeleted } from './getUserFeedbacksSearchDeleted';

export type GetUserFeedbacksParams = {
  /**
   * The page number to retrieve
   */
  page?: number;
  /**
   * The number of feedbacks to retrieve per page
   */
  limit?: number;
  /**
   * Filter by feedback category
   */
  'search[category]'?: GetUserFeedbacksSearchCategory;
  /**
   * Filter by deletion status of the feedback
   */
  'search[deleted]'?: GetUserFeedbacksSearchDeleted;
  /**
   * Filter by the creation date of the feedback
   */
  'search[created_at]'?: string;
  /**
   * Filter by the last update date of the feedback
   */
  'search[updated_at]'?: string;
};
