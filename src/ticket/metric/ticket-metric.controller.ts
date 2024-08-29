import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard, UserLevel } from 'src/auth';
import { PartialDateRange, SummaryQuery } from 'src/utils';

import {
  ModSummary,
  ReporterSummary,
  TicketClosedPoint,
  TicketOpenPoint,
  TicketStatusSummary,
  TicketTypeSummary,
} from './ticket-metric.dto';
import { TicketMetricService } from './ticket-metric.service';

@ApiTags('Tickets')
@Controller('tickets/metrics')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class TicketMetricController {
  constructor(private readonly ticketMetricService: TicketMetricService) {}

  @Get('status/summary')
  @ApiOperation({
    summary: 'Ticket status summary',
    description:
      'Get ticket status (pending, approved, partial) counts for a given date range',
    operationId: 'getTicketStatusSummary',
  })
  @ApiResponse({
    status: 200,
    type: TicketStatusSummary,
  })
  async statusSummary(
    @Query() params: PartialDateRange,
  ): Promise<TicketStatusSummary> {
    return this.ticketMetricService.statusSummary(params);
  }

  @Get('type/summary')
  @ApiOperation({
    summary: 'Ticket type summary',
    description: 'Get ticket types counts for a given date range',
    operationId: 'getTicketTypeSummary',
  })
  @ApiResponse({
    status: 200,
    type: TicketTypeSummary,
  })
  async typeSummary(
    @Query() params: PartialDateRange,
  ): Promise<TicketTypeSummary> {
    return this.ticketMetricService.typeSummary(params);
  }

  @Get('open/series')
  @ApiOperation({
    summary: 'Ticket open series',
    description: 'Get a time series of open tickets for a given date range',
    operationId: 'getTicketOpenSeries',
  })
  @ApiResponse({
    status: 200,
    type: [TicketOpenPoint],
  })
  async openSeries(
    @Query() params: PartialDateRange,
  ): Promise<TicketOpenPoint[]> {
    return this.ticketMetricService.openSeries(params);
  }

  @Get('closed/series')
  @ApiOperation({
    summary: 'Ticket closed series',
    description: 'Get a time series of closed tickets for a given date range',
    operationId: 'getTicketClosedSeries',
  })
  @ApiResponse({
    status: 200,
    type: [TicketClosedPoint],
  })
  async closedSeries(
    @Query() params: PartialDateRange,
  ): Promise<TicketClosedPoint[]> {
    return this.ticketMetricService.closedSeries(params);
  }

  @Get('mod/summary')
  @ApiOperation({
    summary: 'Moderator summary',
    description:
      'Get a summary of the top 20 moderators (claimed and handled tickets) for a given date range',
    operationId: 'getModSummary',
  })
  @ApiResponse({
    status: 200,
    type: [ModSummary],
  })
  async modSummary(@Query() params: PartialDateRange): Promise<ModSummary[]> {
    return this.ticketMetricService.modSummary(
      new SummaryQuery({
        ...params,
        limit: 20,
      }),
    );
  }

  @Get('reporter/summary')
  @ApiOperation({
    summary: 'Reporter summary',
    description:
      'Get a summary of the top 20 reporters (submitted tickets) for a given date range',
    operationId: 'getReporterSummary',
  })
  @ApiResponse({
    status: 200,
    type: [ReporterSummary],
  })
  async reporterSummary(
    @Query() params: PartialDateRange,
  ): Promise<ReporterSummary[]> {
    return this.ticketMetricService.reporterSummary(
      new SummaryQuery({
        ...params,
        limit: 20,
      }),
    );
  }
}
