/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import { makeRequest } from '../http/axios';
import type { GetPostFlagsParams, PostFlag } from './model';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Returns a list of post flags based on search criteria.
 * @summary Get a list of post flags
 */
export const postFlags = (
  params?: GetPostFlagsParams,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<PostFlag[]>(
    { url: `/post_flags.json`, method: 'GET', params },
    options,
  );
};
/**
 * Returns detailed information about a specific post flag identified by its ID.
 * @summary Get a post flag by ID
 */
export const postFlag = (
  id: number,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<PostFlag>(
    { url: `/post_flags/${id}.json`, method: 'GET' },
    options,
  );
};
export type PostFlagsResult = NonNullable<
  Awaited<ReturnType<typeof postFlags>>
>;
export type PostFlagResult = NonNullable<Awaited<ReturnType<typeof postFlag>>>;
