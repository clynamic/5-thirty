import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime, DateTimeUnit } from 'luxon';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import {
  convertKeysToCamelCase,
  createTimeBuckets,
  DateRange,
  generateSeriesCountPoints,
  generateSeriesRecordPoints,
  PaginationParams,
  PartialDateRange,
  Raw,
  SeriesCountPoint,
} from 'src/common';
import { UserHeadService } from 'src/user/head/user-head.service';
import { FindOptionsWhere, LessThan, MoreThan, Not, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';
import {
  TicketActivitySummaryQuery,
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketAgeSummaryQuery,
  TicketClosedSeriesQuery,
  TicketCreatedSeriesQuery,
  TicketHandlerSummary,
  TicketReporterSummary,
  TicketStatusSummary,
  TicketTypeSummary,
  TicketTypeSummaryQuery,
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
    query?: TicketTypeSummaryQuery,
  ): Promise<TicketTypeSummary> {
    return new TicketTypeSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.values(TicketQtype).map(async (type) => [
            type,
            await this.ticketRepository.count({
              where: {
                createdAt: DateRange.fill(range).find(),
                qtype: type,
                ...query?.where(),
              },
            }),
          ]),
        ),
      ),
    });
  }

  async openSeries(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
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

    return generateSeriesCountPoints(tickets, range, (ticket) => {
      const startDate = range
        .clamp(DateTime.fromJSDate(ticket.createdAt))
        .setZone(range.timezone);

      const endDate = range
        .clamp(
          ticket.status === TicketStatus.approved
            ? DateTime.fromJSDate(ticket.updatedAt)
            : DateTime.now(),
        )
        .setZone(range.timezone);

      const unit: DateTimeUnit =
        range.scale! === 'minute' || range.scale! === 'hour'
          ? range.scale!
          : 'day';

      // If the ticket was created and closed within the same unit, ignore it
      if (endDate.hasSame(startDate, unit)) return undefined;

      return createTimeBuckets(startDate, endDate, range.scale!);
    });
  }

  async createdSeries(
    range?: PartialDateRange,
    query?: TicketCreatedSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: {
        createdAt: range.find(),
        ...query?.where(),
      },
    });

    return generateSeriesCountPoints(tickets, range, (ticket) =>
      DateTime.fromJSDate(ticket.createdAt),
    );
  }

  async closedSeries(
    range?: PartialDateRange,
    query?: TicketClosedSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: this.whereCreatedOrUpdated(range, query?.where()),
    });

    const endDate = DateTime.fromJSDate(range.endDate!, {
      zone: range.timezone,
    });

    return generateSeriesCountPoints(tickets, range, (ticket) => {
      const closedDate = DateTime.fromJSDate(ticket.updatedAt, {
        zone: range.timezone,
      });
      if (closedDate <= endDate) return closedDate;
      return undefined;
    });
  }

  async activitySummary(
    range?: PartialDateRange,
    query?: TicketActivitySummaryQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const tickets = await this.ticketRepository.find({
      where: this.whereCreatedOrUpdated(range, query?.where()),
    });

    const counts: Record<string, number> = {};
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

      if (!query || ticket.creatorId === query.reporterId) {
        const createdHour = createdDate.toISO()!;
        counts[createdHour] = (counts[createdHour] || 0) + 1;
      }

      if (updatedDate && (!query || ticket.handlerId === query.claimantId)) {
        const updatedHour = updatedDate.toISO()!;
        counts[updatedHour] = (counts[updatedHour] || 0) + 1;
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
        if (!(dateString in counts)) {
          counts[dateString] = 0;
        }
      }
    }

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (dateTime) =>
          new SeriesCountPoint({
            date: dateTime.toJSDate(),
            value: counts[dateTime.toISO()!] ?? 0,
          }),
      );
  }

  async ageSeries(range?: PartialDateRange): Promise<TicketAgeSeriesPoint[]> {
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

    return generateSeriesRecordPoints<TicketEntity, Raw<TicketAgeSummary>>(
      tickets,
      range,
      (ticket) =>
        createTimeBuckets(
          range
            .clamp(DateTime.fromJSDate(ticket.createdAt))
            .setZone(range.timezone),
          range
            .clamp(
              ticket.status === TicketStatus.approved
                ? // minus 1 day would remove tickets that were closed on the same day - do we want that?
                  DateTime.fromJSDate(ticket.updatedAt) // .minus({ days: 1 })
                : DateTime.now(),
            )
            .setZone(range.timezone),
          range.scale!,
        ),
      (ticket) => {
        const ageInDays = DateTime.fromJSDate(ticket.updatedAt).diff(
          DateTime.fromJSDate(ticket.createdAt),
          'days',
        ).days;

        if (ageInDays <= 1) {
          return 'oneDay';
        } else if (ageInDays <= 3) {
          return 'threeDays';
        } else if (ageInDays <= 7) {
          return 'oneWeek';
        } else if (ageInDays <= 14) {
          return 'twoWeeks';
        } else if (ageInDays <= 30) {
          return 'oneMonth';
        } else {
          return 'aboveOneMonth';
        }
      },
      [
        'oneDay',
        'threeDays',
        'oneWeek',
        'twoWeeks',
        'oneMonth',
        'aboveOneMonth',
      ] as const,
    ).map(
      (e) =>
        new TicketAgeSeriesPoint({
          date: e.date,
          ...e.value,
        }),
    );
  }

  async ageSummary(
    range?: PartialDateRange,
    query?: TicketAgeSummaryQuery,
  ): Promise<TicketAgeSummary> {
    range = DateRange.fill(range);
    const tickets = await this.ticketRepository.find({
      where: { ...range.where(), ...query?.where() },
    });

    const ageGroups = new TicketAgeSummary({
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

      let ageGroup: keyof TicketAgeSummary;

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

    return new TicketAgeSummary(ageGroups);
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
