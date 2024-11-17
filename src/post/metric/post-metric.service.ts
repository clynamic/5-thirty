import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { max, min, sub } from 'date-fns';
import { PostFlagType } from 'src/api';
import { Cacheable } from 'src/app/browser.module';
import { ApprovalEntity } from 'src/approval/approval.entity';
import {
  collapseTimeScaleDuration,
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
  toRawQuery,
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

  static getPendingSeriesKey(range?: PartialDateRange): string {
    range = DateRange.fill(range);
    return `pendingSeries?${toRawQuery(range)}`;
  }

  @Cacheable(PostMetricService.getPendingSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [PostVersionEntity, PermitEntity, ApprovalEntity, FlagEntity],
    disable: true,
  })
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

    const endDates = new Map<number, Date>();

    approvals.forEach((approval) => {
      const approvalDate = approval.createdAt;
      const currentStop = endDates.get(approval.postId);
      if (!currentStop || approvalDate < currentStop) {
        endDates.set(approval.postId, approvalDate);
      }
    });

    deletions.forEach((deletion) => {
      const deletionDate = deletion.createdAt;
      const currentStop = endDates.get(deletion.postId);
      if (!currentStop || deletionDate < currentStop) {
        endDates.set(deletion.postId, deletionDate);
      }
    });

    const scale = collapseTimeScaleDuration(range.scale!);

    const dates = posts.map((post) => {
      const startDate = max([post.updatedAt, range.startDate!]);

      const mapEndDate = endDates.get(post.postId);
      const endDate = min([
        mapEndDate ? sub(mapEndDate, { [scale]: 1 }) : new Date(),
        range.endDate!,
      ]);

      return new DateRange({ startDate, endDate });
    });

    return generateSeriesCountPoints(dates, range);
  }
}
