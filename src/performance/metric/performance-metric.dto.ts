import { ConvertKeysToCamelCase, Raw } from 'src/common';

export type ActivityType =
  // Many more, which we are currently not syncing.
  | 'upload_post'
  | 'approve_post'
  | 'delete_post'
  | 'create_replacement'
  | 'approve_replacement'
  // TODO: When a replacement is rejected, the ID of the user that rejected it is not stored.
  // Why is that the case? >:(
  // | 'reject_replacement'
  | 'create_ticket'
  | 'close_ticket';

export enum UserArea {
  Admin = 'admin',
  Moderator = 'moderator',
  Janitor = 'janitor',
  Member = 'member',
}

export class ActivitySummaryQuery {
  constructor(value: Raw<ActivitySummaryQuery>) {
    Object.assign(this, value);
  }

  userId?: number;
  area?: UserArea;
}

export class ActivitySeriesPoint
  implements ConvertKeysToCamelCase<Record<ActivityType, number>>
{
  constructor(value: Raw<ActivitySeriesPoint>) {
    Object.assign(this, value);
  }

  date: Date;
  uploadPost: number;
  approvePost: number;
  deletePost: number;
  createReplacement: number;
  approveReplacement: number;
  // rejectReplacement: number;
  createTicket: number;
  closeTicket: number;
}
