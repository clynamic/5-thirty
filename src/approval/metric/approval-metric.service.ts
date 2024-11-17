import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { set } from 'date-fns';
import {
  convertKeysToCamelCase,
  DateRange,
  generateSeriesCountPoints,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
} from 'src/common';
import { UserHeadService } from 'src/user/head/user-head.service';
import { Repository } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';
import {
  ApprovalActivitySummaryQuery,
  ApprovalCountSeriesQuery,
  ApprovalCountSummary,
  ApproverSummary,
} from './approval-metric.dto';

@Injectable()
export class ApprovalMetricService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    private readonly userHeadService: UserHeadService,
  ) {}

  async countSummary(range?: PartialDateRange): Promise<ApprovalCountSummary> {
    return new ApprovalCountSummary({
      total: await this.approvalRepository.count({
        where: DateRange.fill(range).where(),
      }),
    });
  }

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

  async activitySummary(
    range?: PartialDateRange,
    query?: ApprovalActivitySummaryQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const approvals = await this.approvalRepository.find({
      where: {
        ...range.where(),
        ...query?.where(),
      },
    });

    const dates = approvals
      .map((approval) =>
        !query || approval.userId === query.userId
          ? set(approval.createdAt, { year: 1970, month: 1, date: 1 })
          : null,
      )
      .filter((date): date is Date => date !== null)
      .flat();

    return generateSeriesCountPoints(
      dates,
      new DateRange({
        startDate: new Date(1970, 1, 1),
        endDate: new Date(1970, 1, 1, 23, 59, 59, 999),
        scale: TimeScale.Hour,
        timezone: range.timezone,
      }),
    );
  }

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

    const ids = results.map((summary) => summary.user_id);

    const heads = await this.userHeadService.get(ids);

    return results.map(
      (summary) =>
        new ApproverSummary({
          ...convertKeysToCamelCase(summary),
          head: heads.find((head) => head.id === summary.user_id),
        }),
    );
  }
}
