import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { set } from 'date-fns';
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

    let items: { date: Date; key: ActivityType }[] = [];
    let allKeys: ActivityType[] = [];

    switch (area) {
      case UserArea.Admin:
        allKeys = query?.userId ? ['upload_post', 'close_ticket'] : [];

        if (query?.userId) {
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
                items.push({ date: post.updatedAt, key: 'upload_post' });
              });
            });
        }

        if (query?.userId) {
          await this.ticketRepository
            .find({
              where: {
                ...range.where(),
                handlerId: query?.userId,
              },
            })
            .then((tickets) => {
              tickets.forEach((ticket) => {
                items.push({ date: ticket.updatedAt, key: 'close_ticket' });
              });
            });
        }

        break;
      case UserArea.Moderator:
        allKeys = query?.userId
          ? ['upload_post', 'close_ticket']
          : ['close_ticket'];

        if (query?.userId) {
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
                items.push({ date: post.updatedAt, key: 'upload_post' });
              });
            });
        }

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
              items.push({ date: ticket.updatedAt, key: 'close_ticket' });
            });
          });

        break;
      case UserArea.Janitor:
        allKeys = query?.userId
          ? [
              'upload_post',
              'approve_post',
              'delete_post',
              'create_replacement',
              'approve_replacement',
              'create_ticket',
            ]
          : ['approve_post', 'delete_post', 'approve_replacement'];

        if (query?.userId) {
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
                items.push({ date: post.updatedAt, key: 'upload_post' });
              });
            });
        }

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
                key: 'approve_post',
              });
            });
          });

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
              items.push({ date: flag.createdAt, key: 'delete_post' });
            });
          });

        await this.postReplacementRepository
          .find({
            where: [
              ...(query?.userId
                ? [
                    {
                      ...range.where(),
                      creatorId: query?.userId,
                    },
                  ]
                : []),
              {
                ...range.where(),
                approverId: query?.userId,
              },
            ],
          })
          .then((replacements) => {
            replacements.forEach((replacement) => {
              items.push({
                date: replacement.createdAt,
                key:
                  replacement.creatorId === query?.userId
                    ? 'create_replacement'
                    : 'approve_replacement',
              });
            });
          });

        if (query?.userId) {
          await this.ticketRepository
            .find({
              where: {
                ...range.where(),
                creatorId: query?.userId,
              },
            })
            .then((tickets) => {
              tickets.forEach((ticket) => {
                items.push({ date: ticket.createdAt, key: 'create_ticket' });
              });
            });
        }

        break;
      case UserArea.Member:
        allKeys = ['upload_post', 'create_replacement', 'create_ticket'];

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
              items.push({ date: post.updatedAt, key: 'upload_post' });
            });
          });

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
                key: 'create_replacement',
              });
            });
          });

        await this.ticketRepository
          .find({
            where: {
              ...range.where(),
              creatorId: query?.userId,
            },
          })
          .then((tickets) => {
            tickets.forEach((ticket) => {
              items.push({ date: ticket.createdAt, key: 'create_ticket' });
            });
          });

        break;
    }

    items = items
      .map((e) => ({
        ...e,
        date: set(e.date, { year: 1970, month: 1, date: 1 }),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const dates = items.map((e) => e.date);
    const keys = items.map((e) => e.key);

    return generateSeriesRecordPoints<Record<ActivityType, number>>(
      dates,
      keys,
      // TODO: because we dynamically populate "allKeys", we are technically lying about the type.
      // It will not actually contain all keys with 0. We are going to ignore this for now.
      allKeys,
      DateRange.hoursOnly(range.timezone),
    ).map(
      (e) =>
        new ActivitySeriesPoint({
          date: e.date,
          ...convertKeysToCamelCase(e.value),
        }),
    );
  }
}
