import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEventAction } from 'src/api';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesCountPoints,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
} from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import {
  ApprovalCountSeriesQuery,
  ApprovalCountSummary,
  ApproverSummary,
} from './approval-metric.dto';

@Injectable()
export class ApprovalMetricService {
  constructor(
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
  ) {}

  @Cacheable({
    prefix: 'approval',
    ttl: 10 * 60 * 1000,
    dependencies: [PostEventEntity],
  })
  async countSummary(range?: PartialDateRange): Promise<ApprovalCountSummary> {
    const filledRange = DateRange.fill(range);

    const result = await this.postEventRepository
      .createQueryBuilder('latest_event')
      .select('COUNT(*)', 'total')
      .innerJoin(
        (subQuery) =>
          subQuery
            .select('post_event.post_id', 'post_id')
            .addSelect('MAX(post_event.created_at)', 'max_created_at')
            .from(PostEventEntity, 'post_event')
            .where('post_event.action IN (:...actions)', {
              actions: [PostEventAction.approved, PostEventAction.unapproved],
            })
            .andWhere('post_event.created_at BETWEEN :startDate AND :endDate', {
              startDate: filledRange.startDate,
              endDate: filledRange.endDate,
            })
            .groupBy('post_event.post_id'),
        'latest',
        'latest_event.post_id = latest.post_id AND latest_event.created_at = latest.max_created_at',
      )
      .where('latest_event.action = :approvedAction', {
        approvedAction: PostEventAction.approved,
      })
      .getRawOne<{ total: number }>();

    return new ApprovalCountSummary({
      total: parseInt(result?.total.toString() || '0'),
    });
  }

  @Cacheable({
    prefix: 'approval',
    ttl: 10 * 60 * 1000,
    dependencies: [PostEventEntity],
  })
  async countSeries(
    range?: PartialDateRange,
    query?: ApprovalCountSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    const filledRange = DateRange.fill(range);

    const queryBuilder = this.postEventRepository
      .createQueryBuilder('latest_event')
      .select('latest_event.created_at', 'created_at')
      .innerJoin(
        (subQuery) =>
          subQuery
            .select('post_event.post_id', 'post_id')
            .addSelect('MAX(post_event.created_at)', 'max_created_at')
            .from(PostEventEntity, 'post_event')
            .where('post_event.action IN (:...actions)', {
              actions: [PostEventAction.approved, PostEventAction.unapproved],
            })
            .andWhere('post_event.created_at BETWEEN :startDate AND :endDate', {
              startDate: filledRange.startDate,
              endDate: filledRange.endDate,
            })
            .groupBy('post_event.post_id'),
        'latest',
        'latest_event.post_id = latest.post_id AND latest_event.created_at = latest.max_created_at',
      )
      .where('latest_event.action = :approvedAction', {
        approvedAction: PostEventAction.approved,
      });

    if (query?.userId) {
      queryBuilder.andWhere('latest_event.creator_id = :userId', {
        userId: query.userId,
      });
    }

    const results = await queryBuilder.getRawMany<{ created_at: Date }>();

    return generateSeriesCountPoints(
      results.map((row) => row.created_at),
      filledRange,
    );
  }

  @Cacheable({
    prefix: 'approval',
    ttl: 15 * 60 * 1000,
    dependencies: [PostEventEntity],
  })
  async approverSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<ApproverSummary[]> {
    const filledRange = DateRange.fill(range);

    const results = await this.postEventRepository
      .createQueryBuilder('latest_event')
      .select('latest_event.creator_id', 'user_id')
      .addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(DISTINCT DATE(latest_event.created_at))', 'days')
      .addSelect('RANK() OVER (ORDER BY COUNT(*) DESC)', 'position')
      .innerJoin(
        (subQuery) =>
          subQuery
            .select('post_event.post_id', 'post_id')
            .addSelect('MAX(post_event.created_at)', 'max_created_at')
            .from(PostEventEntity, 'post_event')
            .where('post_event.action IN (:...actions)', {
              actions: [PostEventAction.approved, PostEventAction.unapproved],
            })
            .andWhere('post_event.created_at BETWEEN :startDate AND :endDate', {
              startDate: filledRange.startDate,
              endDate: filledRange.endDate,
            })
            .groupBy('post_event.post_id'),
        'latest',
        'latest_event.post_id = latest.post_id AND latest_event.created_at = latest.max_created_at',
      )
      .where('latest_event.action = :approvedAction', {
        approvedAction: PostEventAction.approved,
      })
      .groupBy('latest_event.creator_id')
      .orderBy('total', 'DESC')
      .take(pages?.limit || PaginationParams.DEFAULT_PAGE_SIZE)
      .skip(PaginationParams.calculateOffset(pages))
      .getRawMany<{
        user_id: number;
        total: number;
        days: number;
        position: number;
      }>();

    return results.map(
      (summary) =>
        new ApproverSummary({
          ...convertKeysToCamelCase(summary),
        }),
    );
  }
}
