/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * e621 API
 * An API for accessing user information and other resources on e621 and e926.
 * OpenAPI spec version: 1.0.0
 */
import type { GetTicketsParams, Ticket } from './model';
import { makeRequest } from '../http/axios';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Returns a list of tickets based on search criteria.
 * @summary Get a list of tickets
 */
export const tickets = (
  params?: GetTicketsParams,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<Ticket[]>(
    { url: `/tickets.json`, method: 'GET', params },
    options,
  );
};
/**
 * Returns detailed information about a specific ticket identified by its ID.
 * @summary Get a ticket by ID
 */
export const ticket = (
  id: number,
  options?: SecondParameter<typeof makeRequest>,
) => {
  return makeRequest<Ticket>(
    { url: `/tickets/${id}.json`, method: 'GET' },
    options,
  );
};
export type TicketsResult = NonNullable<Awaited<ReturnType<typeof tickets>>>;
export type TicketResult = NonNullable<Awaited<ReturnType<typeof ticket>>>;