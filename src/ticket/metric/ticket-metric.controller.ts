import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import { PaginationParams, PartialDateRange } from 'src/utils';

import {
  ReporterSummary,
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
    @Query() range?: PartialDateRange,
  ): Promise<TicketStatusSummary> {
    return this.ticketMetricService.statusSummary(range);
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
    @Query() range?: PartialDateRange,
  ): Promise<TicketTypeSummary> {
    return this.ticketMetricService.typeSummary(range);
  }

  @Get('type/summary/claimed/:claimantId')
  @ApiOperation({
    summary: 'Ticket type summary for a ticketer',
    description:
      'Get ticket types counts for a given date range for a specific ticketer',
    operationId: 'getTicketTypeSummaryForTicketer',
  })
  @ApiResponse({
    status: 200,
    type: TicketTypeSummary,
  })
  async typeSummaryForTicketer(
    @Param('claimantId') claimantId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketTypeSummary> {
    return this.ticketMetricService.typeSummary(
      range,
      new TicketTypeSummaryUserQuery({ claimantId }),
    );
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
    @Query() range?: PartialDateRange,
  ): Promise<TicketOpenPoint[]> {
    return this.ticketMetricService.openSeries(range);
  }

  @Get('created/series')
  @ApiOperation({
    summary: 'Ticket created series',
    description: 'Get a time series of created tickets for a given date range',
    operationId: 'getTicketCreatedSeries',
  })
  @ApiResponse({
    status: 200,
    type: [TicketCreatedPoint],
  })
  async createdSeries(
    @Query() range?: PartialDateRange,
  ): Promise<TicketCreatedPoint[]> {
    return this.ticketMetricService.createdSeries(range);
  }

  @Get('created/series/:repoterId')
  @ApiOperation({
    summary: 'Ticket created series for a reporter',
    description:
      'Get a time series of created tickets for a given date range for a specific reporter',
    operationId: 'getTicketCreatedSeriesForReporter',
  })
  @ApiResponse({
    status: 200,
    type: [TicketCreatedPoint],
  })
  async createdSeriesForReporter(
    @Param('repoterId') reporterId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketCreatedPoint[]> {
    return this.ticketMetricService.createdSeries(
      range,
      new TicketCreatedUserQuery({ creatorId: reporterId }),
    );
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
    @Query() range?: PartialDateRange,
  ): Promise<TicketClosedPoint[]> {
    return this.ticketMetricService.closedSeries(range);
  }

  @Get('closed/series/:handlerId')
  @ApiOperation({
    summary: 'Ticket closed series for a ticketer',
    description:
      'Get a time series of closed tickets for a given date range for a specific ticketer',
    operationId: 'getTicketClosedSeriesForTicketer',
  })
  @ApiResponse({
    status: 200,
    type: [TicketClosedPoint],
  })
  async closedSeriesForTicketer(
    @Param('handlerId') handlerId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketClosedPoint[]> {
    return this.ticketMetricService.closedSeries(
      range,
      new TicketClosedUserQuery({ handlerId }),
    );
  }

  @Get('age/series')
  @ApiOperation({
    summary: 'Ticket age series',
    description: 'Get a time series of ticket ages for a given date range',
    operationId: 'getTicketAgeSeries',
  })
  @ApiResponse({
    status: 200,
    type: [TicketAgeSeriesPoint],
  })
  async ageSeries(
    @Query() range?: PartialDateRange,
  ): Promise<TicketAgeSeriesPoint[]> {
    return this.ticketMetricService.ageSeries(range);
  }

  @Get('age/summary')
  @ApiOperation({
    summary: 'Ticket age summary',
    description: 'Get a summary of ticket ages for a given date range',
    operationId: 'getTicketAgeSummary',
  })
  @ApiResponse({
    status: 200,
    type: TicketAgeSummary,
  })
  async ageSummary(
    @Query() range?: PartialDateRange,
  ): Promise<TicketAgeSummary> {
    return this.ticketMetricService.ageSummary(range);
  }

  @Get('ticketer/summary')
  @ApiOperation({
    summary: 'Ticketer summary',
    description:
      'Get a summary of the top 20 ticket handlers (claimed and handled tickets) for a given date range',
    operationId: 'getTicketerSummary',
  })
  @ApiResponse({
    status: 200,
    type: [TicketerSummary],
  })
  async ticketerSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
  ): Promise<TicketerSummary[]> {
    return this.ticketMetricService.ticketerSummary(range, pages);
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
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
  ): Promise<ReporterSummary[]> {
    return this.ticketMetricService.reporterSummary(range, pages);
  }
}
