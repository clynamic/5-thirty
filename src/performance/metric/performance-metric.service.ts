import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostFlagType, TicketStatus } from 'src/api';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { getUserLevelFromString, UserLevel } from 'src/auth/auth.level';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesRecordPoints,
  PartialDateRange,
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { UserEntity } from 'src/user/user.entity';
import { Repository } from 'typeorm';

import {
  ActivitySeriesPoint,
  ActivitySummaryQuery,
  ActivityType,
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
  ) {}

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

        switch (getUserLevelFromString(user?.levelString)) {
          case UserLevel.Admin:
            area = UserArea.Admin;
            break;
          case UserLevel.Moderator:
            area = UserArea.Moderator;
            break;
          case UserLevel.Janitor:
            area = UserArea.Janitor;
            break;
          default:
            area = UserArea.Member;
            break;
        }
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

    for (const key of new Set(allKeys)) {
      switch (key) {
        case 'post_create':
          await this.postVersionRepository
            .find({
              where: {
                version: 1,
                updatedAt: range.find(),
                updaterId: query?.userId,
              },
            })
            .then((posts) => {
              posts.forEach((post) => {
                items.push({ date: post.updatedAt, key: 'post_create' });
              });
            });
          break;
        case 'post_approve':
          await this.approvalRepository
            .find({
              where: {
                ...range.where(),
                userId: query?.userId,
              },
            })
            .then((approvals) => {
              approvals.forEach((approval) => {
                items.push({
                  date: approval.createdAt,
                  key: 'post_approve',
                });
              });
            });
          break;
        case 'post_delete':
          await this.flagRepository
            .find({
              where: {
                ...range.where(),
                type: PostFlagType.deletion,
                creatorId: query?.userId,
              },
            })
            .then((flags) => {
              flags.forEach((flag) => {
                items.push({ date: flag.createdAt, key: 'post_delete' });
              });
            });
          break;
        case 'post_replacement_create':
          await this.postReplacementRepository
            .find({
              where: {
                ...range.where(),
                creatorId: query?.userId,
              },
            })
            .then((replacements) => {
              replacements.forEach((replacement) => {
                items.push({
                  date: replacement.createdAt,
                  key:
                    replacement.creatorId === query?.userId
                      ? 'post_replacement_create'
                      : 'post_replacement_approve',
                });
              });
            });
          break;
        case 'post_replacement_approve':
          await this.postReplacementRepository
            .find({
              where: {
                ...range.where(),
                approverId: query?.userId,
              },
            })
            .then((replacements) => {
              replacements.forEach((replacement) => {
                items.push({
                  date: replacement.createdAt,
                  key: 'post_replacement_approve',
                });
              });
            });
          break;
        case 'ticket_create':
          await this.ticketRepository
            .find({
              where: {
                ...range.where(),
                creatorId: query?.userId,
              },
            })
            .then((tickets) => {
              tickets.forEach((ticket) => {
                items.push({ date: ticket.createdAt, key: 'ticket_create' });
              });
            });
          break;
        case 'ticket_handle':
          await this.ticketRepository
            .find({
              where: {
                ...range.where(),
                status: TicketStatus.approved,
                handlerId: query?.userId,
              },
            })
            .then((tickets) => {
              tickets.forEach((ticket) => {
                items.push({ date: ticket.updatedAt, key: 'ticket_handle' });
              });
            });
          break;
      }
    }

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
