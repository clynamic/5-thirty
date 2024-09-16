import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import { UserHeadService } from 'src/user/head/user-head.service';
import {
  convertKeysToCamelCase,
  DateRange,
  PaginationParams,
  PartialDateRange,
} from 'src/utils';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';
import {
  ReporterSummary,
  TicketAgeGroup,
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketClosedPoint,
  TicketClosedUserQuery,
  TicketCreatedPoint,
  TicketCreatedUserQuery,
  TicketerSummary,
  TicketOpenPoint,
  TicketStatusSummary,
  TicketTypeSummary,
  TicketTypeSummaryUserQuery,
} from './ticket-metric.dto';

@Injectable()
export class TicketMetricService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
    private readonly userHeadService: UserHeadService,
  ) {}

  async statusSummary(range?: PartialDateRange): Promise<TicketStatusSummary> {
    range = DateRange.orCurrentMonth(range);
    return new TicketStatusSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.values(TicketStatus).map(async (status) => [
            status,
            await this.ticketRepository.count({
              where: [
                {
                  createdAt: range.toFindOptions(),
                  status,
                },
                {
                  updatedAt: range.toFindOptions(),
                  status,
                },
                ...(status !== TicketStatus.approved ? [{ status }] : []),
              ],
            }),
          ]),
        ),
      ),
    });
  }

  async typeSummary(
    range?: PartialDateRange,
    user?: TicketTypeSummaryUserQuery,
  ): Promise<TicketTypeSummary> {
    return new TicketTypeSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.entries(TicketQtype).map(async ([, type]) => [
            type,
            await this.ticketRepository.count({
              where: {
                ...DateRange.orCurrentMonth(range).toWhereOptions(),
                qtype: type,
                ...user?.toWhereOptions(),
              },
            }),
          ]),
        ),
      ),
    });
  }

  async openSeries(range?: PartialDateRange): Promise<TicketOpenPoint[]> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: [
        {
          createdAt: range.toFindOptions(),
        },
        {
          updatedAt: range.toFindOptions(),
        },
        {
          createdAt: LessThan(range.startDate!),
          updatedAt: MoreThan(range.endDate!),
        },
        {
          status: Not(TicketStatus.approved),
        },
      ],
    });

    const openTicketCounts: Record<string, number> = {};

    tickets.forEach((ticket) => {
      const createdDate = DateTime.max(
        DateTime.fromJSDate(ticket.createdAt),
        DateTime.fromJSDate(range.startDate!).startOf('day'),
      );
      const endDate = DateTime.min(
        (ticket.status === TicketStatus.approved
          ? DateTime.fromJSDate(ticket.updatedAt)
              // we exclude the day the ticket was closed
              .minus({ days: 1 })
          : DateTime.now()
        ).endOf('day'),
        DateTime.fromJSDate(range.endDate!),
      );

      for (
        let date = createdDate;
        date <= endDate;
        date = date.plus({ days: 1 })
      ) {
        const formattedDate = date.toISODate()!;
        openTicketCounts[formattedDate] =
          (openTicketCounts[formattedDate] || 0) + 1;
      }
    });

    return Object.keys(openTicketCounts)
      .map((date) => DateTime.fromISO(date))
      .sort()
      .map(
        (date) =>
          new TicketOpenPoint({
            date: date.toJSDate(),
            count: openTicketCounts[date.toISODate()!]!,
          }),
      );
  }

  async createdSeries(
    range?: PartialDateRange,
    user?: TicketCreatedUserQuery,
  ): Promise<TicketCreatedPoint[]> {
    const tickets = await this.ticketRepository.find({
      where: {
        ...DateRange.orCurrentMonth(range).toWhereOptions(),
        ...user?.toWhereOptions(),
      },
    });

    const counts: Record<string, number> = {};

    for (const ticket of tickets) {
      const createdDate = DateTime.fromJSDate(ticket.createdAt).toISODate()!;
      counts[createdDate] = (counts[createdDate] || 0) + 1;
    }

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date))
      .sort()
      .map(
        (date) =>
          new TicketCreatedPoint({
            date: date.toJSDate(),
            count: counts[date.toISODate()!]!,
          }),
      );
  }

  async closedSeries(
    range?: PartialDateRange,
    user?: TicketClosedUserQuery,
  ): Promise<TicketClosedPoint[]> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: [
        {
          createdAt: range.toFindOptions(),
          status: TicketStatus.approved,
          ...user?.toWhereOptions(),
        },
        {
          updatedAt: range.toFindOptions(),
          status: TicketStatus.approved,
          ...user?.toWhereOptions(),
        },
      ],
    });

    const counts: Record<string, number> = {};
    const endDate = DateTime.fromJSDate(range.endDate!);

    console.log(tickets);

    for (const ticket of tickets) {
      const closedDate = DateTime.fromJSDate(ticket.updatedAt);
      if (closedDate > endDate) continue;
      const dateString = closedDate.toISODate()!;
      counts[dateString] = (counts[dateString] || 0) + 1;
    }

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date))
      .sort()
      .map(
        (date) =>
          new TicketClosedPoint({
            date: date.toJSDate(),
            count: counts[date.toISODate()!]!,
          }),
      );
  }

  async ageSeries(range?: PartialDateRange): Promise<TicketAgeSeriesPoint[]> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: range.toWhereOptions(),
    });

    const series: Record<string, TicketAgeGroup> = {};

    for (const ticket of tickets) {
      const endDate = DateTime.fromJSDate(
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!,
      );
      const ageInDays = endDate.diff(
        DateTime.fromJSDate(ticket.createdAt),
        'day',
      ).days;
      const closedDate = endDate.toISODate()!;

      let ageGroup: keyof TicketAgeGroup;

      if (ageInDays <= 1) {
        ageGroup = 'oneDay';
      } else if (ageInDays <= 3) {
        ageGroup = 'threeDays';
      } else if (ageInDays <= 7) {
        ageGroup = 'oneWeek';
      } else if (ageInDays <= 14) {
        ageGroup = 'twoWeeks';
      } else if (ageInDays <= 30) {
        ageGroup = 'oneMonth';
      } else {
        ageGroup = 'aboveOneMonth';
      }

      if (!series[closedDate]) {
        series[closedDate] = new TicketAgeGroup({
          oneDay: 0,
          threeDays: 0,
          oneWeek: 0,
          twoWeeks: 0,
          oneMonth: 0,
          aboveOneMonth: 0,
        });
      }

      series[closedDate][ageGroup]++;
    }

    return Object.keys(series)
      .map((date) => DateTime.fromISO(date))
      .sort()
      .map(
        (date) =>
          new TicketAgeSeriesPoint({
            date: date.toJSDate(),
            groups: series[date.toISODate()!]!,
          }),
      );
  }

  async ageSummary(range?: PartialDateRange): Promise<TicketAgeSummary> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: range.toWhereOptions(),
    });

    const ageGroups = new TicketAgeGroup({
      oneDay: 0,
      threeDays: 0,
      oneWeek: 0,
      twoWeeks: 0,
      oneMonth: 0,
      aboveOneMonth: 0,
    });

    for (const ticket of tickets) {
      const endDate = DateTime.fromJSDate(
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!,
      );
      const ageInDays = endDate.diff(
        DateTime.fromJSDate(ticket.createdAt),
        'day',
      ).days;

      let ageGroup: keyof TicketAgeGroup;

      if (ageInDays <= 1) {
        ageGroup = 'oneDay';
      } else if (ageInDays <= 3) {
        ageGroup = 'threeDays';
      } else if (ageInDays <= 7) {
        ageGroup = 'oneWeek';
      } else if (ageInDays <= 14) {
        ageGroup = 'twoWeeks';
      } else if (ageInDays <= 30) {
        ageGroup = 'oneMonth';
      } else {
        ageGroup = 'aboveOneMonth';
      }

      ageGroups[ageGroup]++;
    }

    return new TicketAgeSummary({
      groups: ageGroups,
    });
  }

  async ticketerSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<TicketerSummary[]> {
    const results = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where({
        ...DateRange.orCurrentMonth(range).toWhereOptions(),
        handlerId: Not(0),
      })
      .select('ticket.handler_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'total')
      .addSelect('COUNT(DISTINCT DATE(ticket.updated_at))', 'days')
      .addSelect(`RANK() OVER (ORDER BY COUNT(ticket.id) DESC)`, 'position')
      .groupBy('ticket.handler_id')
      .orderBy('total', 'DESC')
      .take(pages?.limit || PaginationParams.DEFAULT_PAGE_SIZE)
      .skip(PaginationParams.calculateOffset(pages))
      .getRawMany<{
        user_id: number;
        total: number;
        days: number;
        position: number;
      }>();

    const ids = results.map((row) => row.user_id);

    const heads = await this.userHeadService.get(ids);

    return results.map(
      (row) =>
        new TicketerSummary({
          ...convertKeysToCamelCase(row),
          head: heads.find((head) => head.id === row.user_id),
        }),
    );
  }

  async reporterSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<ReporterSummary[]> {
    const results = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.creator_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'total')
      .addSelect('COUNT(DISTINCT DATE(ticket.updated_at))', 'days')
      .where(DateRange.orCurrentMonth(range).toWhereOptions())
      .groupBy('ticket.creator_id')
      .orderBy('total', 'DESC')
      .take(pages?.limit || PaginationParams.DEFAULT_PAGE_SIZE)
      .skip(PaginationParams.calculateOffset(pages))
      .getRawMany<{
        user_id: number;
        total: number;
        days: number;
      }>();

    const counts = results.map(
      (row) => new ReporterSummary(convertKeysToCamelCase(row)),
    );

    const heads = await this.userHeadService.get(counts.map((c) => c.userId));

    return counts.map((count) => ({
      ...count,
      head: heads.find((head) => head.id === count.userId),
    }));
  }
}
