/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetTicketsSearchQtype } from './getTicketsSearchQtype';
import type { GetTicketsSearchStatus } from './getTicketsSearchStatus';

export type GetTicketsParams = {
  /**
   * The page number to retrieve
   */
  page?: number;
  /**
   * The number of tickets to retrieve per page
   */
  limit?: number;
  /**
   * Filter by the creation date of the ticket
   */
  'search[created_at]'?: string;
  /**
   * Filter by the last update date of the ticket
   */
  'search[updated_at]'?: string;
  /**
   * Filter by ticket ID
   */
  'search[id]'?: string;
  /**
   * Filter by the creator's username
   */
  'search[creator_name]'?: string;
  /**
   * Filter by the accused user's username
   */
  'search[accused_name]'?: string;
  /**
   * Filter by the claimant's username
   */
  'search[claimant_name]'?: string;
  /**
   * Filter by the reason for the ticket
   */
  'search[reason]'?: string;
  /**
   * Filter by the type of the ticket (e.g., user, comment, post)
   */
  'search[qtype]'?: GetTicketsSearchQtype;
  /**
   * Filter by the status of the ticket
   */
  'search[status]'?: GetTicketsSearchStatus;
};
