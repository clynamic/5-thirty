import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfDay, sub } from 'date-fns';
import { PostFlagType, TicketStatus } from 'src/api';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { getUserLevelFromString } from 'src/auth/auth.level';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesRecordPoints,
  getClosestTimeScale,
  getDurationKeyForScale,
  PartialDateRange,
  WithDate,
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { UserHeadService } from 'src/user/head/user-head.service';
import { UserEntity } from 'src/user/user.entity';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';

import {
  ActivitySeriesPoint,
  ActivitySummary,
  ActivitySummaryQuery,
  ActivityType,
  getActivityScore,
  getPerformanceScoreGrade,
  getPerformanceTrendGrade,
  getUserAreaFromLevel,
  PerformanceSummary,
  PerformanceSummaryQuery,
  UserArea,
} from './performance-metric.dto';

@Injectable()
export class PerformanceMetricService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(PostReplacementEntity)
    private readonly postReplacementRepository: Repository<PostReplacementEntity>,
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
    private readonly userHeadService: UserHeadService,
  ) {}

  private whereCreatedOrUpdated<T extends WithDate>(
    range?: PartialDateRange,
    options?: FindOptionsWhere<T>,
  ): FindOptionsWhere<T>[] {
    range = DateRange.fill(range);
    return [
      {
        createdAt: range.find(),
        ...options,
      } as FindOptionsWhere<T>,
      {
        updatedAt: range.find(),
        ...options,
      } as FindOptionsWhere<T>,
    ];
  }

  private async findActivities(
    keys: ActivityType[],
    range: PartialDateRange,
    userId?: number,
  ): Promise<Record<number, Partial<Record<ActivityType, Date[]>>>> {
    const items: Record<number, Partial<Record<ActivityType, Date[]>>> = {};

    const storeItem = (key: ActivityType, userId: number, date: Date) => {
      if (!items[userId]) {
        items[userId] = {};
      }

      if (!items[userId]![key]) {
        items[userId]![key] = [];
      }

      items[userId]![key].push(date);
    };

    for (const key of new Set(keys)) {
      switch (key) {
        case 'post_create':
          await this.postVersionRepository
            .find({
              where: {
                version: 1,
                updatedAt: range.find(),
                updaterId: userId,
              },
              select: ['updaterId', 'updatedAt'],
            })
            .then((posts) =>
              posts.forEach((post) =>
                storeItem('post_create', post.updaterId, post.updatedAt),
              ),
            );
          break;
        case 'post_approve':
          await this.approvalRepository
            .find({
              where: {
                ...range.where(),
                userId: userId,
              },
              select: ['userId', 'createdAt'],
            })
            .then((approvals) =>
              approvals.forEach((approval) =>
                storeItem('post_approve', approval.userId, approval.createdAt),
              ),
            );
          break;
        case 'post_delete':
          await this.flagRepository
            .find({
              where: {
                ...range.where(),
                type: PostFlagType.deletion,
                creatorId: userId,
              },
              select: ['creatorId', 'createdAt'],
            })
            .then((flags) =>
              flags.forEach((flag) =>
                storeItem('post_delete', flag.creatorId, flag.createdAt),
              ),
            );
          break;
        case 'post_replacement_create':
          await this.postReplacementRepository
            .find({
              where: {
                ...range.where(),
                creatorId: userId,
              },
              select: ['creatorId', 'createdAt'],
            })
            .then((replacements) =>
              replacements.forEach((replacement) =>
                storeItem(
                  'post_replacement_create',
                  replacement.creatorId,
                  replacement.createdAt,
                ),
              ),
            );
          break;
        case 'post_replacement_approve':
          await this.postReplacementRepository
            .find({
              where: {
                ...range.where(),
                approverId: userId ? userId : Not(IsNull()),
              },
              select: ['approverId', 'updatedAt'],
            })
            .then((replacements) =>
              replacements.forEach((replacement) =>
                storeItem(
                  'post_replacement_approve',
                  replacement.approverId!,
                  replacement.updatedAt,
                ),
              ),
            );
          break;
        case 'ticket_create':
          await this.ticketRepository
            .find({
              where: {
                ...range.where(),
                creatorId: userId,
              },
              select: ['creatorId', 'createdAt'],
            })
            .then((tickets) =>
              tickets.forEach((ticket) =>
                storeItem('ticket_create', ticket.creatorId, ticket.createdAt),
              ),
            );
          break;
        case 'ticket_handle':
          await this.ticketRepository
            .find({
              where: this.whereCreatedOrUpdated<TicketEntity>(range, {
                status: TicketStatus.approved,
                handlerId: userId ? userId : Not(IsNull()),
              }),
              select: ['handlerId', 'updatedAt'],
            })
            .then((tickets) =>
              tickets.forEach((ticket) =>
                storeItem('ticket_handle', ticket.handlerId, ticket.updatedAt),
              ),
            );
          break;
      }
    }

    return items;
  }

  async performance(
    range?: PartialDateRange,
    query?: PerformanceSummaryQuery,
  ): Promise<PerformanceSummary[]> {
    range = DateRange.fill(range);

    let allKeys: ActivityType[] = [];

    if (query?.activities?.length) {
      allKeys = query.activities;
    } else {
      let area: UserArea = UserArea.Member;
      if (query?.area) {
        area = query.area;
      } else if (query?.userId) {
        const user = await this.userRepository.findOne({
          where: { id: query.userId },
        });

        area = getUserAreaFromLevel(getUserLevelFromString(user?.levelString));
      }

      switch (area) {
        case UserArea.Admin:
          allKeys = ['ticket_handle'];
          break;
        case UserArea.Moderator:
          allKeys = ['ticket_handle'];
          break;
        case UserArea.Janitor:
          allKeys = ['post_approve', 'post_replacement_approve'];
          break;
        case UserArea.Member:
          allKeys = [];
          break;
      }
    }

    const data = await Promise.all(
      Array.from({ length: 4 }, async (_, i) => {
        const scale = getClosestTimeScale(range as DateRange);
        const duration = getDurationKeyForScale(scale);
        const shiftedRange = new DateRange({
          ...range,
          startDate: sub(range.startDate!, { [duration]: i }),
          endDate: sub(range.endDate!, { [duration]: i }),
        });

        return this.findActivities(allKeys, shiftedRange, query?.userId).then(
          (rawData) =>
            Object.fromEntries(
              Object.entries(rawData).map(([userId, activities]) => [
                Number(userId),
                Object.fromEntries(
                  Object.entries(activities).map(([key, dates]) => [
                    key as ActivityType,
                    dates,
                  ]),
                ) as Record<ActivityType, Date[]>,
              ]),
            ) as Record<number, Record<ActivityType, Date[]>>,
        );
      }),
    );

    const scores = data.map(
      (e) =>
        Object.fromEntries(
          Object.entries(e).map(([userId, activities]) => [
            Number(userId),
            Object.entries(activities).reduce(
              (acc, [key, value]) =>
                acc + value.length * getActivityScore(key as ActivityType),
              0,
            ),
          ]),
        ) as Record<number, number>,
    );

    const activities: Record<number, ActivitySummary> = Object.fromEntries(
      Object.entries(data[0]!).map(([userId, activities]) => [
        Number(userId),
        new ActivitySummary({
          ...convertKeysToCamelCase(
            Object.fromEntries(
              Object.entries(activities).map(([key, value]) => [
                key,
                value.length,
              ]),
            ) as Record<ActivityType, number>,
          ),
        }),
      ]),
    ) as Record<number, ActivitySummary>;

    const days = Object.fromEntries(
      Object.entries(data[0]!).map(([userId, activities]) => [
        Number(userId),
        new Set(
          Object.values(activities).flatMap((dates) =>
            dates.map((date) => startOfDay(date).getTime()),
          ),
        ).size,
      ]),
    );

    const automod = await this.userRepository
      .findOne({
        where: {
          name: 'auto_moderator',
        },
        select: ['id'],
      })
      .then((user) => user?.id);

    if (automod) {
      scores.forEach((score) => delete score[automod!]);
    }

    const averageScores = scores.map(
      (score) =>
        Object.values(score).reduce((sum, value) => sum + value, 0) /
        Object.values(score).length,
    );

    const relativeScores = scores.map(
      (e, i) =>
        Object.fromEntries(
          Object.entries(e).map(([userId, value]) => [
            userId,
            Math.round((value / averageScores[i]!) * 100),
          ]),
        ) as Record<number, number>,
    );

    const trendScores = Object.fromEntries(
      Object.entries(relativeScores[0]!).map(([userId, value]) => [
        Number(userId),
        value -
          Math.round(
            Object.values(relativeScores)
              .slice(1)
              .reduce((acc, e) => acc + e[+userId]!, 0) /
              (relativeScores.length - 1),
          ),
      ]),
    ) as Record<number, number>;

    const result: { userId: number; score: number }[] = Object.entries(
      relativeScores[0]!,
    )
      .map(([userId, value]) => ({
        userId: Number(userId),
        score: value,
      }))
      .sort((a, b) => b.score - a.score);

    const heads = query?.head
      ? await this.userHeadService.get(result.map((e) => e.userId))
      : [];

    return result
      .map(
        (e, i) =>
          new PerformanceSummary({
            userId: e.userId,
            userHead: heads.find((head) => head.id === e.userId),
            position: i + 1,
            score: e.score,
            scoreGrade: getPerformanceScoreGrade(e.score),
            trend: trendScores[e.userId]!,
            trendGrade: getPerformanceTrendGrade(trendScores[e.userId]!),
            previousScores: relativeScores.slice(1).map((d) => d[e.userId]!),
            activitySummary: activities[e.userId]!,
            days: days[e.userId]!,
          }),
      )
      .filter((e) => (query?.userId ? e.userId === query.userId : true));
  }

  async activity(
    range?: PartialDateRange,
    query?: ActivitySummaryQuery,
  ): Promise<ActivitySeriesPoint[]> {
    range = DateRange.fill(range);

    let allKeys: ActivityType[] = [];

    if (query?.activities?.length) {
      allKeys = query.activities;
    } else {
      let area: UserArea = UserArea.Member;
      if (query?.area) {
        area = query.area;
      } else if (query?.userId) {
        const user = await this.userRepository.findOne({
          where: { id: query.userId },
        });

        area = getUserAreaFromLevel(getUserLevelFromString(user?.levelString));
      }

      switch (area) {
        case UserArea.Admin:
          allKeys = query?.userId ? ['post_create', 'ticket_handle'] : [];
          break;
        case UserArea.Moderator:
          allKeys = query?.userId
            ? ['post_create', 'ticket_handle']
            : ['ticket_handle'];
          break;
        case UserArea.Janitor:
          allKeys = query?.userId
            ? [
                'post_create',
                'post_delete',
                'post_approve',
                'post_replacement_create',
                'post_replacement_approve',
                'ticket_create',
              ]
            : ['post_approve', 'post_delete', 'post_replacement_approve'];
          break;
        case UserArea.Member:
          allKeys = ['post_create', 'post_replacement_create', 'ticket_create'];
          break;
      }
    }

    const items: { date: Date; key: ActivityType }[] = [];

    await this.findActivities(allKeys, range, query?.userId).then((data) => {
      for (const [, activities] of Object.entries(data)) {
        for (const [key, value] of Object.entries(activities)) {
          value!.forEach((date) =>
            items.push({ date, key: key as ActivityType }),
          );
        }
      }
    });

    return generateSeriesRecordPoints<Record<ActivityType, number>>(
      items.map((e) => e.date),
      items.map((e) => e.key),
      allKeys,
      range,
    ).map(
      (e) =>
        new ActivitySeriesPoint({
          date: e.date,
          ...convertKeysToCamelCase(e.value),
        }),
    );
  }
}
