import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { TicketQtype, TicketStatus } from 'src/api/e621';
import { TicketEntity } from 'src/ticket';
import { DateRange, PartialDateRange } from 'src/utils';
import { Repository } from 'typeorm';

import {
  ModSummary,
  ReporterSummary,
  TicketClosedPoint,
  TicketClosedSeries,
  TicketOpenPoint,
  TicketOpenSeries,
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
                ...params.toCreatedAtRange(),
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
              where: { ...params.toCreatedAtRange(), qtype: type },
            }),
          ]),
        ),
      ),
    });
  }

  async openSeries(params?: PartialDateRange): Promise<TicketOpenSeries> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: params.toCreatedAtRange(),
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

    const points = Object.keys(openTicketCounts)
      .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
      .map(
        (date) =>
          new TicketOpenPoint({
            date: new Date(date),
            count: openTicketCounts[date],
          }),
      );

    return new TicketOpenSeries({
      range: params,
      points,
    });
  }

  async closedSeries(params?: PartialDateRange): Promise<TicketClosedSeries> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: {
        ...params.toCreatedAtRange(),
        status: TicketStatus.approved,
      },
    });

    const closedTicketCounts: Record<string, number> = {};

    tickets.forEach((ticket) => {
      const closedDate = dayjs(ticket.updatedAt).format('YYYY-MM-DD');
      closedTicketCounts[closedDate] =
        (closedTicketCounts[closedDate] || 0) + 1;
    });

    const points = Object.keys(closedTicketCounts)
      .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
      .map(
        (date) =>
          new TicketClosedPoint({
            date: new Date(date),
            closed: closedTicketCounts[date],
          }),
      );

    return new TicketClosedSeries({
      range: params,
      points,
    });
  }

  async modSummary(params?: PartialDateRange): Promise<ModSummary[]> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: params.toCreatedAtRange(),
    });

    const modSummaryMap: Record<number, { claimed: number; handled: number }> =
      {};

    tickets.forEach((ticket) => {
      if (ticket.claimantId) {
        modSummaryMap[ticket.claimantId] = modSummaryMap[ticket.claimantId] || {
          claimed: 0,
          handled: 0,
        };
        modSummaryMap[ticket.claimantId].claimed += 1;
      }

      if (ticket.handlerId) {
        modSummaryMap[ticket.handlerId] = modSummaryMap[ticket.handlerId] || {
          claimed: 0,
          handled: 0,
        };
        modSummaryMap[ticket.handlerId].handled += 1;
      }
    });

    let result = Object.entries(modSummaryMap).map(
      ([userId, { claimed, handled }]) =>
        new ModSummary({
          userId,
          claimed,
          handled,
        }),
    );

    result.sort((a, b) => b.handled - a.handled);
    result = result.slice(0, 20);

    return result;
  }

  async reporterSummary(params?: PartialDateRange): Promise<ReporterSummary[]> {
    params = DateRange.orCurrentMonth(params);
    const tickets = await this.ticketRepository.find({
      where: params.toCreatedAtRange(),
    });

    const reporterSummaryMap: Record<number, number> = {};

    tickets.forEach((ticket) => {
      reporterSummaryMap[ticket.creatorId] =
        (reporterSummaryMap[ticket.creatorId] || 0) + 1;
    });

    let result = Object.entries(reporterSummaryMap).map(
      ([userId, count]) =>
        new ReporterSummary({
          userId,
          reported: count,
        }),
    );

    result.sort((a, b) => b.reported - a.reported);
    result = result.slice(0, 20);

    return result;
  }
}
