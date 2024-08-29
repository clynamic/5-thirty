import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { DateRange, PartialDateRange } from 'src/utils';
import { Repository } from 'typeorm';

import { ApprovalEntity } from '../approval.entity';
import {
  ApprovalCountPoint,
  ApprovalCountSeries,
  ApprovalCountSummary,
  JanitorSummary,
} from './approval-metric.dto';

@Injectable()
export class ApprovalMetricService {
  constructor(
    @InjectRepository(ApprovalEntity)
    private readonly approvalRepository: Repository<ApprovalEntity>,
  ) {}

  async countSummary(params?: PartialDateRange): Promise<ApprovalCountSummary> {
    params = DateRange.orCurrentMonth(params);
    return new ApprovalCountSummary({
      range: params,
      total: await this.approvalRepository.count({
        where: params.toWhereOptions(),
      }),
    });
  }

  async countSeries(params?: PartialDateRange): Promise<ApprovalCountSeries> {
    params = DateRange.orCurrentMonth(params);

    const points = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('DATE(approval.created_at) as date')
      .addSelect('COUNT(*) as count')
      .where(params.toWhereOptions()!)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return new ApprovalCountSeries({
      range: params,
      points: points.map(
        (point) =>
          new ApprovalCountPoint({
            date: dayjs(point.date).toDate(),
            count: parseInt(point.count),
          }),
      ),
    });
  }

  async janitorSummary(params?: PartialDateRange): Promise<JanitorSummary[]> {
    params = DateRange.orCurrentMonth(params);

    const janitorSummaries = await this.approvalRepository
      .createQueryBuilder('approval')
      .select('approval.creator_id')
      .addSelect('COUNT(*) as count')
      .where(params.toWhereOptions()!)
      .groupBy('approval.creator_id')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    return janitorSummaries.map(
      (summary) =>
        new JanitorSummary({
          range: params,
          userId: summary.creator_id,
          total: parseInt(summary.count),
        }),
    );
  }
}
