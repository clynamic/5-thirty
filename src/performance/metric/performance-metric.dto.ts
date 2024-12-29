import { ApiProperty } from '@nestjs/swagger';
import { ConvertKeysToCamelCase, Raw } from 'src/common';

export type ActivityType =
  // Many more, which we are currently not syncing.
  | 'post_create'
  | 'post_delete'
  | 'post_approve'
  | 'post_replacement_create'
  | 'post_replacement_approve'
  // TODO: When a replacement is rejected, the ID of the user that rejected it is not stored.
  // Why is that the case? >:(
  // | 'post_replacement_reject'
  | 'ticket_create'
  | 'ticket_handle';

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
  @ApiProperty({ enum: UserArea, enumName: 'UserArea' })
  area?: UserArea;
  activities?: ActivityType[];
}

export class ActivitySeriesPoint
  implements ConvertKeysToCamelCase<Record<ActivityType, number>>
{
  constructor(value: Raw<ActivitySeriesPoint>) {
    Object.assign(this, value);
  }

  date: Date;
  postCreate: number;
  postDelete: number;
  postApprove: number;
  postReplacementCreate: number;
  postReplacementApprove: number;
  // postReplacementReject: number;
  ticketCreate: number;
  ticketHandle: number;
}
