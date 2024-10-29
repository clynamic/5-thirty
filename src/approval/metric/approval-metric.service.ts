import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import {
  convertKeysToCamelCase,
  DateRange,
  fillDateCounts,
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
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

    const counts: Record<string, number> = {};

    for (const approval of approvals) {
      const createdDate = DateTime.fromJSDate(approval.createdAt, {
        zone: range.timezone,
      });
      const dateString = createdDate.toISODate()!;
      counts[dateString] = (counts[dateString] || 0) + 1;
    }

    fillDateCounts(range, counts);

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (date) =>
          new SeriesCountPoint({
            date: date.toJSDate(),
            value: counts[date.toISODate()!]!,
          }),
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

    const counts: Record<string, number> = {};
    let minDate: DateTime | null = null;
    let maxDate: DateTime | null = null;

    for (const approval of approvals) {
      const createdDate = DateTime.fromJSDate(approval.createdAt, {
        zone: range.timezone,
      })
        .set({ year: 1970, month: 1, day: 1 })
        .startOf('hour');

      const createdHour = createdDate.toISO()!;
      counts[createdHour] = (counts[createdHour] || 0) + 1;

      minDate = DateTime.min(minDate ?? createdDate, createdDate);
      maxDate = DateTime.max(maxDate ?? createdDate, createdDate);
    }

    if (minDate && maxDate) {
      for (
        let currentDate = minDate;
        currentDate <= maxDate;
        currentDate = currentDate.plus({ hours: 1 })
      ) {
        const dateString = currentDate.toISO()!;
        if (!(dateString in counts)) {
          counts[dateString] = 0;
        }
      }
    }

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (date) =>
          new SeriesCountPoint({
            date: date.toJSDate(),
            value: counts[date.toISO()!] ?? 0,
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
