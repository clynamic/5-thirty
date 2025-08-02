import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInHours, max, min, sub } from 'date-fns';
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
  toRawQuery,
} from 'src/common';
import { FindOptionsWhere, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import { TicketEntity } from '../ticket.entity';
import {
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketAgeSummaryQuery,
  TicketClosedSeriesQuery,
  TicketCreatedSeriesQuery,
  TicketHandlerSummary,
  TicketReporterSummary,
  TicketStatusSeriesPoint,
  TicketTypeSummary,
  TicketTypeSummaryQuery,
} from './ticket-metric.dto';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class TicketMetricService {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketRepository: Repository<TicketEntity>,
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

  static getStatusKey(range?: PartialDateRange): string {
    range = DateRange.fill(range);
    return `ticket-status?${toRawQuery(range)}`;
  }

  @Cacheable(TicketMetricService.getStatusKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [TicketEntity],
  })
  async status(range?: PartialDateRange): Promise<TicketStatusSeriesPoint[]> {
    range = DateRange.fill(range);

    const tickets = await this.ticketRepository.find({
      where: [
        ...this.whereCreatedOrUpdated(range),
        {
          createdAt: LessThan(range.endDate!),
          status: Not(TicketStatus.approved),
        },
      ],
    });

    return generateSeriesRecordPoints<Record<TicketStatus, number>>(
      tickets.map((ticket) => max([ticket.createdAt, range.startDate!])),
      tickets.map((ticket) => ticket.status),
      Object.values(TicketStatus),
      range,
    ).map(
      (e) =>
        new TicketStatusSeriesPoint({
          date: e.date,
          ...e.value,
        }),
    );
  }

  static getTypeSummaryKey(
    range?: PartialDateRange,
    query?: TicketTypeSummaryQuery,
  ): string {
    return `ticket-type-summary?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(TicketMetricService.getTypeSummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [TicketEntity],
  })
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

  static getOpenSeriesKey(partialRange?: PartialDateRange): string {
    const range = DateRange.fill(partialRange);
    return `ticket-open-series?${toRawQuery(range)}`;
  }

  @Cacheable(TicketMetricService.getOpenSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [TicketEntity],
  })
  async openSeries(
    partialRange?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    const range = DateRange.fill(partialRange);
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

    const scale = collapseTimeScaleDuration(range.scale);

    const dates = tickets
      .map((ticket) => {
        const startDate = max([ticket.createdAt, range.startDate]);

        const handledDate =
          ticket.status === TicketStatus.approved ? ticket.updatedAt : null;

        const endDate = min([
          handledDate ? sub(handledDate, { [scale]: 1 }) : new Date(),
          range.endDate,
        ]);

        if (startDate >= endDate) return null;

        return new DateRange({ startDate, endDate });
      })
      .filter((date): date is DateRange => date !== null);

    return generateSeriesCountPoints(dates, range);
  }

  static getCreatedSeriesKey(
    range?: PartialDateRange,
    query?: TicketCreatedSeriesQuery,
  ): string {
    return `ticket-created-series?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(TicketMetricService.getCreatedSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [TicketEntity],
  })
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

  static getClosedSeriesKey(
    range?: PartialDateRange,
    query?: TicketClosedSeriesQuery,
  ): string {
    return `ticket-closed-series?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(TicketMetricService.getClosedSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [TicketEntity],
  })
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

  static getAgeSeriesKey(range?: PartialDateRange): string {
    const filledRange = DateRange.fill(range);
    return `ticket-age-series?${toRawQuery(filledRange)}`;
  }

  @Cacheable(TicketMetricService.getAgeSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [TicketEntity],
  })
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

  static getAgeSummaryKey(
    range?: PartialDateRange,
    query?: TicketAgeSummaryQuery,
  ): string {
    return `ticket-age-summary?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(TicketMetricService.getAgeSummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [TicketEntity],
  })
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

  static getHandlerSummaryKey(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): string {
    return `ticket-handler-summary?${toRawQuery({ ...range, ...pages })}`;
  }

  @Cacheable(TicketMetricService.getHandlerSummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [TicketEntity, UserEntity],
  })
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

    return results.map(
      (row) =>
        new TicketHandlerSummary({
          ...convertKeysToCamelCase(row),
        }),
    );
  }

  static getReporterSummaryKey(
    range?: PartialDateRange,
    pages?: PaginationParams,
  ): string {
    return `ticket-reporter-summary?${toRawQuery({ ...range, ...pages })}`;
  }

  @Cacheable(TicketMetricService.getReporterSummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [TicketEntity, UserEntity],
  })
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

    return results.map(
      (row) => new TicketReporterSummary(convertKeysToCamelCase(row)),
    );
  }
}
