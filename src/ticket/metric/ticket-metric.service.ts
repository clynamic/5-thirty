import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
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
  TicketCreatedPoint,
  TicketerSummary,
  TicketOpenPoint,
  TicketStatusSummary,
  TicketTypeSummary,
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

  async typeSummary(range?: PartialDateRange): Promise<TicketTypeSummary> {
    return new TicketTypeSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.entries(TicketQtype).map(async ([, type]) => [
            type,
            await this.ticketRepository.count({
              where: {
                ...DateRange.orCurrentMonth(range).toWhereOptions(),
                qtype: type,
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
      const createdDate = dayjs.max(
        dayjs(ticket.createdAt),
        dayjs(range.startDate),
      );
      const endDate =
        ticket.status === TicketStatus.approved
          ? dayjs(ticket.updatedAt)
          : dayjs().utc();

      for (
        let date = createdDate;
        !date.isAfter(endDate) && !date.isAfter(range.endDate);
        date = date.add(1, 'day')
      ) {
        const formattedDate = date.format('YYYY-MM-DD');
        openTicketCounts[formattedDate] =
          (openTicketCounts[formattedDate] || 0) + 1;
      }
    });

    return Object.keys(openTicketCounts)
      .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
      .map(
        (date) =>
          new TicketOpenPoint({
            date: new Date(date),
            count: openTicketCounts[date]!,
          }),
      );
  }

  async createdSeries(range?: PartialDateRange): Promise<TicketCreatedPoint[]> {
    const tickets = await this.ticketRepository.find({
      where: DateRange.orCurrentMonth(range).toWhereOptions(),
    });

    const createdTicketCounts: Record<string, number> = {};

    tickets.forEach((ticket) => {
      const createdDate = dayjs(ticket.createdAt).format('YYYY-MM-DD');
      createdTicketCounts[createdDate] =
        (createdTicketCounts[createdDate] || 0) + 1;
    });

    return Object.keys(createdTicketCounts)
      .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
      .map(
        (date) =>
          new TicketCreatedPoint({
            date: new Date(date),
            count: createdTicketCounts[date]!,
          }),
      );
  }

  async closedSeries(range?: PartialDateRange): Promise<TicketClosedPoint[]> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: [
        {
          createdAt: range.toFindOptions(),
          status: TicketStatus.approved,
        },
        {
          updatedAt: range.toFindOptions(),
          status: TicketStatus.approved,
        },
      ],
    });

    const closedTicketCounts: Record<string, number> = {};

    tickets.forEach((ticket) => {
      const closedDate = dayjs(ticket.updatedAt).format('YYYY-MM-DD');
      closedTicketCounts[closedDate] =
        (closedTicketCounts[closedDate] || 0) + 1;
    });

    return Object.keys(closedTicketCounts)
      .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
      .map(
        (date) =>
          new TicketClosedPoint({
            date: new Date(date),
            count: closedTicketCounts[date]!,
          }),
      );
  }

  async ageSeries(range?: PartialDateRange): Promise<TicketAgeSeriesPoint[]> {
    range = DateRange.orCurrentMonth(range);
    const tickets = await this.ticketRepository.find({
      where: range.toWhereOptions(),
    });

    const series: Record<string, TicketAgeGroup> = {};

    tickets.forEach((ticket) => {
      const endDate = dayjs(
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!,
      );
      const ageInDays = endDate.diff(dayjs(ticket.createdAt), 'day');
      const closedDate = endDate.format('YYYY-MM-DD');

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
    });

    return Object.keys(series)
      .map(
        (date) =>
          new TicketAgeSeriesPoint({
            date: new Date(date),
            groups: series[date]!,
          }),
      )
      .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
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

    tickets.forEach((ticket) => {
      const endDate = dayjs(
        ticket.status === TicketStatus.approved
          ? ticket.updatedAt
          : range.endDate!,
      );
      const ageInDays = endDate.diff(dayjs(ticket.createdAt), 'day');

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
    });

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
