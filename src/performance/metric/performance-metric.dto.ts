import { ApiProperty } from '@nestjs/swagger';
import { UserLevel } from 'src/auth/auth.level';
import { ConvertKeysToCamelCase, Raw } from 'src/common';
import { UserHead } from 'src/user/head/user-head.dto';

export enum Activity {
  // Many more, which we are currently not syncing.
  PostCreate = 'post_create',
  PostDelete = 'post_delete',
  PostApprove = 'post_approve',
  PostReplacementCreate = 'post_replacement_create',
  PostReplacementApprove = 'post_replacement_approve',
  // TODO: When a replacement is rejected, the ID of the user that rejected it is not stored.
  // Why is that the case? >:(
  PostReplacementReject = 'post_replacement_reject',
  TicketCreate = 'ticket_create',
  TicketHandle = 'ticket_handle',
}

export enum UserArea {
  Admin = 'admin',
  Moderator = 'moderator',
  Janitor = 'janitor',
  Member = 'member',
}

export class ActivitySummary
  implements ConvertKeysToCamelCase<Record<Activity, number>>
{
  constructor(value: Raw<ActivitySummary>) {
    Object.assign(this, value);
  }

  postCreate: number;
  postDelete: number;
  postApprove: number;
  postReplacementCreate: number;
  postReplacementApprove: number;
  postReplacementReject: number;
  ticketCreate: number;
  ticketHandle: number;
}

export class PerformanceSummaryQuery {
  constructor(value: Raw<PerformanceSummaryQuery>) {
    Object.assign(this, value);
  }

  userId?: number;
  head?: boolean;

  @ApiProperty({ enum: UserArea, enumName: 'UserArea' })
  area?: UserArea;
  @ApiProperty({ enum: Activity, enumName: 'Activity', isArray: true })
  activities?: Activity[];
}

export const getUserAreaFromLevel = (level?: UserLevel): UserArea => {
  switch (level) {
    case UserLevel.Admin:
      return UserArea.Admin;
    case UserLevel.Moderator:
      return UserArea.Moderator;
    case UserLevel.Janitor:
      return UserArea.Janitor;
    default:
      return UserArea.Member;
  }
};

export const getActivityScore = (activity: Activity): number => {
  switch (activity) {
    case Activity.TicketHandle:
      return 1;
    case Activity.PostApprove:
      return 1;
    case Activity.PostDelete:
      return 1.25;
    case Activity.PostReplacementApprove:
      return 1.1;
    default:
      return 0;
  }
};

export enum PerformanceGrade {
  F = 'F',
  E = 'E',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  S = 'S',
  S2 = 'S2',
  S3 = 'S3',
  S4 = 'S4',
  S5 = 'S5',
  S6 = 'S6',
}

export const getPerformanceScoreGrade = (score: number): PerformanceGrade => {
  if (score < 5) return PerformanceGrade.F;
  if (score < 20) return PerformanceGrade.E;
  if (score < 50) return PerformanceGrade.D;
  if (score < 75) return PerformanceGrade.C;
  if (score < 100) return PerformanceGrade.B;
  if (score < 150) return PerformanceGrade.A;
  if (score < 200) return PerformanceGrade.S;
  if (score < 250) return PerformanceGrade.S2;
  if (score < 300) return PerformanceGrade.S3;
  if (score < 350) return PerformanceGrade.S4;
  if (score < 400) return PerformanceGrade.S5;
  return PerformanceGrade.S6;
};

export enum TrendGrade {
  plummet = 'plummet',
  drop = 'drop',
  decline = 'decline',
  neutral = 'neutral',
  rise = 'rise',
  climb = 'climb',
  surge = 'surge',
}

export const getPerformanceTrendGrade = (trend: number): TrendGrade => {
  if (trend < -75) return TrendGrade.plummet;
  if (trend < -25) return TrendGrade.drop;
  if (trend < 0) return TrendGrade.decline;
  if (trend < 25) return TrendGrade.neutral;
  if (trend < 50) return TrendGrade.rise;
  if (trend < 100) return TrendGrade.climb;
  return TrendGrade.surge;
};

export class PerformanceRecord {
  constructor(value: Raw<PerformanceRecord>) {
    Object.assign(this, value);
  }

  score: number;
  @ApiProperty({ enum: PerformanceGrade, enumName: 'PerformanceGrade' })
  grade: PerformanceGrade;
}

export class PerformanceSummary {
  constructor(value: Raw<PerformanceSummary>) {
    Object.assign(this, value);
  }

  userId: number;
  userHead?: UserHead;

  position: number;
  score: number;
  @ApiProperty({ enum: PerformanceGrade, enumName: 'PerformanceGrade' })
  scoreGrade: PerformanceGrade;
  trend: number;
  @ApiProperty({ enum: TrendGrade, enumName: 'TrendGrade' })
  trendGrade: TrendGrade;

  history: PerformanceRecord[];
  activity: ActivitySummary;
  days: number;
}

export class ActivitySummaryQuery {
  constructor(value: Raw<ActivitySummaryQuery>) {
    Object.assign(this, value);
  }

  userId?: number;
  @ApiProperty({ enum: UserArea, enumName: 'UserArea' })
  area?: UserArea;
  @ApiProperty({ enum: Activity, enumName: 'Activity', isArray: true })
  activities?: Activity[];
}

export class ActivitySeriesPoint extends ActivitySummary {
  constructor(value: Raw<ActivitySeriesPoint>) {
    super(value);
  }

  date: Date;
}
