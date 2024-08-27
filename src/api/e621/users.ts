/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetUsersParams, User } from './model';
import { makeRequest } from '../http/axios';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Returns a list of users based on search criteria.
 * @summary Get a list of users
 */
export const users = (
  params?: GetUsersParams,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<User[]>(
    { url: `/users.json`, method: 'GET', params },
    options,
  );
};
/**
 * Returns detailed information about a user identified by their ID or username.
 * @summary Get user information by ID or username
 */
export const user = (
  id: string,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<User>(
    { url: `/users/${id}.json`, method: 'GET' },
    options,
  );
};
export type UsersResult = NonNullable<Awaited<ReturnType<typeof users>>>;
export type UserResult = NonNullable<Awaited<ReturnType<typeof user>>>;
