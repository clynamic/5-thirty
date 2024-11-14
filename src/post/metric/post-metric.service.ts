import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime, DateTimeUnit } from 'luxon';
import { PostFlagType } from 'src/api';
import { ApprovalEntity } from 'src/approval/approval.entity';
import {
  createTimeBuckets,
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
import { In, Repository } from 'typeorm';

import { PostStatusSummary } from './post-metric.dto';

@Injectable()
export class PostMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
  ) {}

  async statusSummary(range?: PartialDateRange): Promise<PostStatusSummary> {
    range = DateRange.fill(range);

    const posts = await this.postVersionRepository
      .find({
        select: ['postId'],
        where: {
          updatedAt: range.find(),
          version: 1,
        },
      })
      .then((versions) => versions.map((version) => version.postId));

    const approved = await this.approvalRepository.count({
      where: {
        postId: In(posts),
      },
    });

    const deleted = await this.flagRepository.count({
      where: {
        postId: In(posts),
        type: PostFlagType.deletion,
      },
    });

    const permitted = await this.permitRepository.count({
      where: {
        postId: In(posts),
      },
    });

    return new PostStatusSummary({
      approved,
      deleted,
      permitted,
      pending: posts.length - approved - deleted - permitted,
    });
  }

  async pendingSeries(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    let posts = await this.postVersionRepository.find({
      select: ['postId', 'updatedAt'],
      where: {
        updatedAt: range.find(),
        version: 1,
      },
    });

    const permitted = await this.permitRepository
      .find({
        select: ['postId'],
        where: {
          postId: In(posts.map((post) => post.postId)),
        },
      })
      .then((permits) => permits.map((permit) => permit.postId));

    posts = posts.filter((post) => !permitted.includes(post.postId));

    const postIds = posts.map((post) => post.postId);

    const approvals = await this.approvalRepository.find({
      where: {
        postId: In(postIds),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const deletions = await this.flagRepository.find({
      where: {
        postId: In(postIds),
        type: PostFlagType.deletion,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const endDates = new Map<number, DateTime>();

    approvals.forEach((approval) => {
      const approvalDate = DateTime.fromJSDate(approval.createdAt);
      const currentStop = endDates.get(approval.postId);
      if (!currentStop || approvalDate < currentStop) {
        endDates.set(approval.postId, approvalDate);
      }
    });

    deletions.forEach((deletion) => {
      const deletionDate = DateTime.fromJSDate(deletion.createdAt);
      const currentStop = endDates.get(deletion.postId);
      if (!currentStop || deletionDate < currentStop) {
        endDates.set(deletion.postId, deletionDate);
      }
    });

    return generateSeriesCountPoints(posts, range, (post) => {
      const startDate = range
        .clamp(DateTime.fromJSDate(post.updatedAt))
        .setZone(range.timezone);

      const stopDate = endDates.get(post.postId) || DateTime.now();

      const unit: DateTimeUnit =
        range.scale! === 'minute' || range.scale! === 'hour'
          ? range.scale!
          : 'day';

      if (stopDate.hasSame(startDate, unit)) return undefined;

      return createTimeBuckets(startDate, stopDate, range.scale!);
    });
  }
}
