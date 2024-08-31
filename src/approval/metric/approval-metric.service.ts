import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { UserHeadService } from 'src/user/head/user-head.service';
import { convertKeysToCamelCase, DateRange, PartialDateRange } from 'src/utils';
import { Repository } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';
import {
  ApprovalCountPoint,
  ApprovalCountSummary,
  JanitorSummary,
} from './approval-metric.dto';

@Injectable()
export class ApprovalMetricService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
    private readonly userHeadService: UserHeadService,
  ) {}

  async countSummary(params?: PartialDateRange): Promise<ApprovalCountSummary> {
    return new ApprovalCountSummary({
      total: await this.approvalRepository.count({
        where: DateRange.orCurrentMonth(params).toWhereOptions(),
      }),
    });
  }

  async countSeries(params?: PartialDateRange): Promise<ApprovalCountPoint[]> {
    const points = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('DATE(approval.created_at) as date')
      .addSelect('COUNT(*) as count')
      .where(DateRange.orCurrentMonth(params).toWhereOptions()!)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return points.map(
      (point) =>
        new ApprovalCountPoint({
          date: dayjs(point.date).toDate(),
          count: parseInt(point.count),
        }),
    );
  }

  async janitorSummary(params?: PartialDateRange): Promise<JanitorSummary[]> {
    params = DateRange.orCurrentMonth(params);

    const janitorSummaries = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('approval.user_id')
      .addSelect('COUNT(*) as total')
      .addSelect('COUNT(DISTINCT DATE(approval.created_at))', 'days')
      .where(params.toWhereOptions()!)
      .groupBy('approval.user_id')
      .orderBy('total', 'DESC')
      .limit(20)
      .getRawMany<{
        user_id: number;
        total: number;
        days: number;
      }>();

    const ids = janitorSummaries.map((summary) => summary.user_id);

    const heads = await this.userHeadService.get(ids);

    return janitorSummaries.map(
      (summary) =>
        new JanitorSummary({
          ...convertKeysToCamelCase(summary),
          head: heads.find((head) => head.id === summary.user_id),
        }),
    );
  }
}
