import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import { UserHeadService } from 'src/user/head/user-head.service';
import { convertKeysToCamelCase, DateRange, PartialDateRange } from 'src/utils';
import { IsNull, Not, Repository } from 'typeorm';

import { TicketEntity } from '../ticket.entity';
import {
  ModSummary,
  ReporterSummary,
  TicketClosedPoint,
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

  async statusSummary(params?: PartialDateRange): Promise<TicketStatusSummary> {
    params = DateRange.orCurrentMonth(params);

    return new TicketStatusSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.values(TicketStatus).map(async (status) => [
            status,
            await this.ticketRepository.count({
              where: {
                ...params.toWhereOptions(),
                status,
              },
            }),
          ]),
        ),
      ),
    });
  }

  async typeSummary(params?: PartialDateRange): Promise<TicketTypeSummary> {
    params = DateRange.orCurrentMonth(params);

    return new TicketTypeSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.entries(TicketQtype).map(async ([, type]) => [
            type,
            await this.ticketRepository.count({
              where: { ...params.toWhereOptions(), qtype: type },
            }),
          ]),
        ),
      ),
    });
  }

  async openSeries(params?: PartialDateRange): Promise<TicketOpenPoint[]> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: params.toWhereOptions(),
    });

    const openTicketCounts: Record<string, number> = {};

    tickets.forEach((ticket) => {
      const createdDate = dayjs(ticket.createdAt);
      const updatedDate =
        ticket.status === TicketStatus.approved
          ? dayjs(ticket.updatedAt)
          : null;

      const endDate = updatedDate || dayjs();

      for (
        let date = createdDate;
        date.isBefore(endDate) || date.isSame(endDate);
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

  async closedSeries(params?: PartialDateRange): Promise<TicketClosedPoint[]> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: {
        ...params.toWhereOptions(),
        status: TicketStatus.approved,
      },
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

  async modSummary(params?: PartialDateRange): Promise<ModSummary[]> {
    const rawResults = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.claimant_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'claimed')
      .addSelect(
        'SUM(CASE WHEN ticket.handler_id = ticket.claimant_id THEN 1 ELSE 0 END)',
        'handled',
      )
      .addSelect('COUNT(DISTINCT DATE(ticket.updated_at))', 'days')
      .andWhere({
        ...DateRange.orCurrentMonth(params).toWhereOptions(),
        claimantId: Not(IsNull()),
      })
      .groupBy('ticket.claimant_id')
      .orderBy('handled', 'DESC')
      .take(20)
      .getRawMany<{
        user_id: number;
        claimed: number;
        handled: number;
        days: number;
      }>();

    const ids = rawResults.map((row) => row.user_id);

    const heads = await this.userHeadService.get(ids);

    return rawResults.map(
      (row) =>
        new ModSummary({
          ...convertKeysToCamelCase(row),
          head: heads.find((head) => head.id === row.user_id),
        }),
    );
  }

  async reporterSummary(params?: PartialDateRange): Promise<ReporterSummary[]> {
    const rawResults = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.creator_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'reported')
      .addSelect('COUNT(DISTINCT DATE(ticket.updated_at))', 'days')
      .where(DateRange.orCurrentMonth(params).toWhereOptions())
      .groupBy('ticket.creator_id')
      .orderBy('reported', 'DESC')
      .take(20)
      .getRawMany<{
        user_id: number;
        reported: number;
        days: number;
      }>();

    const counts = rawResults.map(
      (row) => new ReporterSummary(convertKeysToCamelCase(row)),
    );

    const heads = await this.userHeadService.get(counts.map((c) => c.userId));

    return counts.map((count) => ({
      ...count,
      head: heads.find((head) => head.id === count.userId),
    }));
  }
}
