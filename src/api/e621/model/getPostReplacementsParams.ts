/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetPostReplacementsSearchStatus } from './getPostReplacementsSearchStatus';

export type GetPostReplacementsParams = {
  /**
   * The page number to retrieve
   */
  page?: number;
  /**
   * The number of replacements to retrieve per page
   */
  limit?: number;
  /**
   * Filter replacements by the MD5 hash of the file
   */
  'search[md5]'?: string;
  /**
   * Filter replacements by post ID
   */
  'search[post_id]'?: number;
  /**
   * Filter replacements by the creator's username
   */
  'search[creator_name]'?: string;
  /**
   * Filter replacements by the approver's username
   */
  'search[approver_name]'?: string;
  /**
   * Filter replacements by the uploader's username at approval time
   */
  'search[uploader_name_on_approve]'?: string;
  /**
   * Filter replacements by status
   */
  'search[status]'?: GetPostReplacementsSearchStatus;
  /**
   * Filter replacements by creation date
   */
  'search[created_at]'?: string;
  /**
   * Filter replacements by last update date
   */
  'search[updated_at]'?: string;
  /**
   * Filter replacements by replacement ID
   */
  'search[id]'?: string;
};
