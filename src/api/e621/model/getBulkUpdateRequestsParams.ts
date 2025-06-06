/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetBulkUpdateRequestsSearchStatus } from './getBulkUpdateRequestsSearchStatus';
import type { GetBulkUpdateRequestsSearchOrder } from './getBulkUpdateRequestsSearchOrder';

export type GetBulkUpdateRequestsParams = {
  /**
   * The page number to retrieve
   */
  page?: number;
  /**
   * The number of bulk update requests to retrieve per page
   */
  limit?: number;
  /**
   * Filter by the username of the creator
   */
  'search[user_name]'?: string;
  /**
   * Filter by the username of the approver
   */
  'search[approver_name]'?: string;
  /**
   * Filter by the title of the request
   */
  'search[title_matches]'?: string;
  /**
   * Filter by script content in the request
   */
  'search[script_matches]'?: string;
  /**
   * Filter by the status of the request
   */
  'search[status]'?: GetBulkUpdateRequestsSearchStatus;
  /**
   * Order the results by a specific field
   */
  'search[order]'?: GetBulkUpdateRequestsSearchOrder;
  /**
   * Filter by the creation date of the request
   */
  'search[created_at]'?: string;
  /**
   * Filter by the last update date of the request
   */
  'search[updated_at]'?: string;
};
