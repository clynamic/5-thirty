import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { UserHeadService } from 'src/user/head/user-head.service';
import {
  convertKeysToCamelCase,
  DateRange,
  PaginationParams,
  PartialDateRange,
} from 'src/utils';
import { Repository } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';
import {
  ApprovalCountPoint,
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
        where: DateRange.orCurrentMonth(range).toWhereOptions(),
      }),
    });
  }

  async countSeries(range?: PartialDateRange): Promise<ApprovalCountPoint[]> {
    const points = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('DATE(approval.created_at) as date')
      .addSelect('COUNT(*) as count')
      .where(DateRange.orCurrentMonth(range).toWhereOptions()!)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{
        date: string;
        count: number;
      }>();

    return points.map(
      (point) =>
        new ApprovalCountPoint({
          date: DateTime.fromISO(point.date).toJSDate(),
          count: point.count,
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
      .where(DateRange.orCurrentMonth(range).toWhereOptions()!)
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
