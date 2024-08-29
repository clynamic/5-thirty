import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import { DateRange, PartialDateRange, SummaryQuery } from 'src/utils';
import { Repository } from 'typeorm';

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
  ) {}

  async statusSummary(params?: PartialDateRange): Promise<TicketStatusSummary> {
    params = DateRange.orCurrentMonth(params);

    return new TicketStatusSummary({
      range: params,
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
      range: params,
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
            closed: closedTicketCounts[date]!,
          }),
      );
  }

  async modSummary(params?: SummaryQuery): Promise<ModSummary[]> {
    const rawResults = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.claimant_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'claimed')
      .addSelect(
        'SUM(CASE WHEN ticket.handler_id = ticket.claimant_id THEN 1 ELSE 0 END)',
        'handled',
      )
      .where(DateRange.orCurrentMonth(params).toWhereOptions())
      .groupBy('ticket.claimant_id')
      .orderBy('handled', 'DESC')
      .take(params?.limit)
      .getRawMany<{
        user_id: string;
        claimed: string;
        handled: string;
      }>();

    return rawResults.map(
      (row) =>
        new ModSummary({
          userId: Number(row.user_id),
          claimed: Number(row.claimed),
          handled: Number(row.handled),
        }),
    );
  }

  async reporterSummary(params?: SummaryQuery): Promise<ReporterSummary[]> {
    const rawResults = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.creator_id', 'user_id')
      .addSelect('COUNT(ticket.id)', 'reported')
      .where(DateRange.orCurrentMonth(params).toWhereOptions())
      .groupBy('ticket.creator_id')
      .orderBy('reported', 'DESC')
      .take(params?.limit)
      .getRawMany<{
        user_id: string;
        reported: string;
      }>();

    return rawResults.map(
      (row) =>
        new ReporterSummary({
          userId: Number(row.user_id),
          reported: Number(row.reported),
        }),
    );
  }
}
