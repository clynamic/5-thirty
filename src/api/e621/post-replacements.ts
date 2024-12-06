/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetPostReplacementsParams, PostReplacement } from './model';
import { makeRequest } from '../http/axios';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Returns a list of post replacements based on search criteria.
 * @summary Get a list of post replacements
 */
export const postReplacements = (
  params?: GetPostReplacementsParams,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<PostReplacement[]>(
    { url: `/post_replacements.json`, method: 'GET', params },
    options,
  );
};
export type PostReplacementsResult = NonNullable<
  Awaited<ReturnType<typeof postReplacements>>
>;