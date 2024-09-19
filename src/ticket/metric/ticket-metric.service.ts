import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import { UserHeadService } from 'src/user/head/user-head.service';
import {
  convertKeysToCamelCase,
  DateRange,
  fillDateCounts,
  PaginationParams,
  PartialDateRange,
} from 'src/utils';
import { FindOptionsWhere, LessThan, MoreThan, Not, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';
import {
  TicketActivityPoint,
  TicketActivityUserQuery,
  TicketAgeGroup,
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketClosedPoint,
  TicketClosedUserQuery,
  TicketCreatedPoint,
  TicketCreatedUserQuery,
  TicketHandlerSummary,
  TicketOpenPoint,
  TicketReporterSummary,
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

  private whereCreatedOrUpdated(
    range?: PartialDateRange,
    options?: FindOptionsWhere<TicketEntity>,
  ): FindOptionsWhere<TicketEntity>[] {
    range = DateRange.fill(range);
    return [
      {
        createdAt: range.find(),
        ...options,
      },
      {
        updatedAt: range.find(),
        ...options,
      },
    ];
  }

  async statusSummary(range?: PartialDateRange): Promise<TicketStatusSummary> {
    range = DateRange.fill(range);
    return new TicketStatusSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.values(TicketStatus).map(async (status) => [
            status,
            await this.ticketRepository.count({
              where: [
                ...this.whereCreatedOrUpdated(range, { status }),
                ...(status !== TicketStatus.approved
                  ? [
                      {
                        createdAt: LessThan(range.endDate!),
                        status,
                      },
                    ]
                  : []),
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
                createdAt: DateRange.fill(range).find(),
                qtype: type,
                ...user?.where(),
              },
            }),
          ]),
        ),
      ),
    });
  }

  async openSeries(range?: PartialDateRange): Promise<TicketOpenPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: [
        ...this.whereCreatedOrUpdated(range),
        {
          createdAt: LessThan(range.startDate!),
          updatedAt: MoreThan(range.endDate!),
        },
        {
          createdAt: LessThan(range.endDate!),
          status: Not(TicketStatus.approved),
        },
      ],
    });

    const counts: Record<string, number> = {};

    for (const ticket of tickets) {
      const createdDate = DateTime.max(
        DateTime.fromJSDate(ticket.createdAt, { zone: range.timezone }).startOf(
          'day',
        ),
        DateTime.fromJSDate(range.startDate!).startOf('day'),
      );
      const endDate = DateTime.min(
        (ticket.status === TicketStatus.approved
          ? DateTime.fromJSDate(ticket.updatedAt, { zone: range.timezone })
              // we exclude the day the ticket was closed
              .minus({ days: 1 })
          : DateTime.now().setZone(range.timezone)
        ).endOf('day'),
        DateTime.fromJSDate(range.endDate!),
      );

      for (
        let date = createdDate;
        date <= endDate;
        date = date.plus({ days: 1 })
      ) {
        const formattedDate = date.toISODate()!;
        counts[formattedDate] = (counts[formattedDate] || 0) + 1;
      }
    }

    fillDateCounts(range, counts);

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (date) =>
          new TicketOpenPoint({
            date: date.toJSDate(),
            count: counts[date.toISODate()!] ?? 0,
          }),
      );
  }

  async createdSeries(
    range?: PartialDateRange,
    user?: TicketCreatedUserQuery,
  ): Promise<TicketCreatedPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: {
        createdAt: range.find(),
        ...user?.where(),
      },
    });

    const counts: Record<string, number> = {};

    for (const ticket of tickets) {
      const createdDate = DateTime.fromJSDate(ticket.createdAt, {
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
          new TicketCreatedPoint({
            date: date.toJSDate(),
            count: counts[date.toISODate()!] ?? 0,
          }),
      );
  }

  async closedSeries(
    range?: PartialDateRange,
    user?: TicketClosedUserQuery,
  ): Promise<TicketClosedPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: this.whereCreatedOrUpdated(range, user?.where()),
    });

    const counts: Record<string, number> = {};
    const endDate = DateTime.fromJSDate(range.endDate!);

    for (const ticket of tickets) {
      const closedDate = DateTime.fromJSDate(ticket.updatedAt, {
        zone: range.timezone,
      });
      if (closedDate > endDate) continue;
      const dateString = closedDate.toISODate()!;
      counts[dateString] = (counts[dateString] || 0) + 1;
    }

    fillDateCounts(range, counts);

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (date) =>
          new TicketClosedPoint({
            date: date.toJSDate(),
            count: counts[date.toISODate()!] ?? 0,
          }),
      );
  }

  async activitySummary(
    range?: PartialDateRange,
    user?: TicketActivityUserQuery,
  ): Promise<TicketActivityPoint[]> {
    range = DateRange.fill(range);

    const tickets = await this.ticketRepository.find({
      where: this.whereCreatedOrUpdated(range, user?.where()),
    });

    const activityCounts: Record<string, number> = {};
    let minDate: DateTime | null = null;
    let maxDate: DateTime | null = null;

    for (const ticket of tickets) {
      const createdDate = DateTime.fromJSDate(ticket.createdAt, {
        zone: range.timezone,
      })
        .set({ year: 1970, month: 1, day: 1 })
        .startOf('hour');
      const updatedDate = ticket.updatedAt
        ? DateTime.fromJSDate(ticket.updatedAt, { zone: range.timezone })
            .set({ year: 1970, month: 1, day: 1 })
            .startOf('hour')
        : null;

      const createdHour = createdDate.toISO()!;
      activityCounts[createdHour] = (activityCounts[createdHour] || 0) + 1;

      if (updatedDate) {
        const updatedHour = updatedDate.toISO()!;
        activityCounts[updatedHour] = (activityCounts[updatedHour] || 0) + 1;
      }

      minDate = DateTime.min(minDate ?? createdDate, createdDate);
      maxDate = DateTime.max(
        maxDate ?? updatedDate ?? createdDate,
        updatedDate ?? createdDate,
      );
    }

    if (minDate && maxDate) {
      for (
        let currentDate = minDate;
        currentDate <= maxDate;
        currentDate = currentDate.plus({ hours: 1 })
      ) {
        const dateString = currentDate.toISO()!;
        if (!(dateString in activityCounts)) {
          activityCounts[dateString] = 0;
        }
      }
    }

    return Object.keys(activityCounts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (dateTime) =>
          new TicketActivityPoint({
            date: dateTime.toJSDate(),
            count: activityCounts[dateTime.toISO()!] ?? 0,
          }),
      );
  }

  async ageSeries(range?: PartialDateRange): Promise<TicketAgeSeriesPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: range.where(),
    });

    const series: Record<string, TicketAgeGroup> = {};

    for (const ticket of tickets) {
      const endDate = DateTime.fromJSDate(
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!,
        { zone: range.timezone },
      );
      const ageInDays = endDate.diff(
        DateTime.fromJSDate(ticket.createdAt),
        'days',
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
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
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
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: range.where(),
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
        { zone: range.timezone },
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

  async handlerSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<TicketHandlerSummary[]> {
    const results = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where({
        createdAt: DateRange.fill(range).find(),
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
        new TicketHandlerSummary({
          ...convertKeysToCamelCase(row),
          head: heads.find((head) => head.id === row.user_id),
        }),
    );
  }

  async reporterSummary(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): Promise<TicketReporterSummary[]> {
    const results = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.creator_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'total')
      .addSelect('COUNT(DISTINCT DATE(ticket.updated_at))', 'days')
      .where(DateRange.fill(range).where())
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
      (row) => new TicketReporterSummary(convertKeysToCamelCase(row)),
    );

    const heads = await this.userHeadService.get(counts.map((c) => c.userId));

    return counts.map((count) => ({
      ...count,
      head: heads.find((head) => head.id === count.userId),
    }));
  }
}
