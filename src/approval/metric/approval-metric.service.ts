import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesCountPoints,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
  toRawQuery,
} from 'src/common';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import { ApprovalEntity } from '../approval.entity';
import {
  ApprovalCountSeriesQuery,
  ApprovalCountSummary,
  ApproverSummary,
} from './approval-metric.dto';

@Injectable()
export class ApprovalMetricService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
  ) {}

  static getCountSummaryKey(range?: PartialDateRange): string {
    range = DateRange.fill(range);
    return `approval-count-summary?${toRawQuery(range)}`;
  }

  @Cacheable(ApprovalMetricService.getCountSummaryKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [ApprovalEntity],
  })
  async countSummary(range?: PartialDateRange): Promise<ApprovalCountSummary> {
    return new ApprovalCountSummary({
      total: await this.approvalRepository.count({
        where: DateRange.fill(range).where(),
      }),
    });
  }

  static getCountSeriesKey(
    range?: PartialDateRange,
    query?: ApprovalCountSeriesQuery,
  ): string {
    return `approval-count-series?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(ApprovalMetricService.getCountSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [ApprovalEntity],
  })
  async countSeries(
    range?: PartialDateRange,
    query?: ApprovalCountSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);
    const approvals = await this.approvalRepository.find({
      where: {
        ...range.where(),
        ...query?.where(),
      },
    });

    return generateSeriesCountPoints(
      approvals.map((approval) => approval.createdAt),
      range,
    );
  }

  static getApproverSummaryKey(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): string {
    return `approval-approver-summary?${toRawQuery({ ...range, ...pages })}`;
  }

  @Cacheable(ApprovalMetricService.getApproverSummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [ApprovalEntity],
  })
  async approverSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<ApproverSummary[]> {
    const results = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('approval.user_id')
      .addSelect('COUNT(*) as total')
      .addSelect('COUNT(DISTINCT DATE(approval.created_at))', 'days')
      .addSelect('RANK() OVER (ORDER BY COUNT(*) DESC)', 'position')
      .where(DateRange.fill(range).where()!)
      .groupBy('approval.user_id')
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
