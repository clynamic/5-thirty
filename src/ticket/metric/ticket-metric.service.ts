import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInHours, max, min, set, sub } from 'date-fns';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import {
  collapseTimeScaleDuration,
  convertKeysToCamelCase,
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

    const scale = collapseTimeScaleDuration(range.scale!);

    const dates = tickets.map((ticket) => {
      return new DateRange({
        startDate: max([ticket.createdAt, range.startDate!]),
        endDate: min([
          ticket.status === TicketStatus.approved
            ? sub(ticket.updatedAt, { [scale]: 1 })
            : range.endDate!,
        ]),
      });
    });

    return generateSeriesCountPoints(dates, range!);
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

    return generateSeriesCountPoints(
      tickets.map((item) => item.createdAt),
      range,
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

    const endDate = range.endDate!;
    return generateSeriesCountPoints(
      tickets.map((item) =>
        item.updatedAt <= endDate ? item.updatedAt : undefined,
      ),
      range,
    );
  }

  async activitySummary(
    range?: PartialDateRange,
    query?: TicketActivitySummaryQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const tickets = await this.ticketRepository.find({
      where: this.whereCreatedOrUpdated(range, query?.where()),
    });

    const dates = tickets
      .map((ticket) => [
        !query || ticket.creatorId === query.reporterId
          ? ticket.createdAt
          : null,
        !query || ticket.claimantId === query.claimantId
          ? ticket.updatedAt
          : null,
      ])
      .map((dates) =>
        dates
          .filter((d) => d !== null)
          .map((d) => set(d!, { year: 1970, month: 1, date: 1 })),
      )
      .flat();

    return generateSeriesCountPoints(
      dates,
      DateRange.hoursOnly(range.timezone),
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

    const dates = tickets.map(
      (ticket) =>
        new DateRange({
          startDate: max([ticket.createdAt, range.startDate!]),
          endDate: min([
            ticket.status === TicketStatus.approved
              ? ticket.updatedAt
              : new Date(),
            range.endDate!,
          ]),
        }),
    );

    const keys = tickets.map((ticket) => {
      // age here is measured in cold dead hours, not zimezone aware intervals.
      // this is because we want to know how long a user had to wait for a response.
      const ageInDays =
        differenceInHours(ticket.updatedAt, ticket.createdAt) / 24;

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
    });

    const allKeys = [
      'oneDay',
      'threeDays',
      'oneWeek',
      'twoWeeks',
      'oneMonth',
      'aboveOneMonth',
    ] as const;

    return generateSeriesRecordPoints<Raw<TicketAgeSummary>>(
      dates,
      keys,
      allKeys,
      range,
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
      const endDate =
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!;
      const ageInDays = differenceInHours(endDate, ticket.createdAt) / 24;

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
