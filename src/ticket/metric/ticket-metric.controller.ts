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
  TicketReporterSummary,
  TicketActivityPoint,
  TicketActivityUserQuery,
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketClosedPoint,
  TicketClosedUserQuery,
  TicketCreatedPoint,
  TicketCreatedUserQuery,
  TicketHandlerSummary,
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

  @Get('type/summary/handler/:claimantId')
  @ApiOperation({
    summary: 'Ticket type summary for a handler',
    description:
      'Get ticket types counts for a given date range for a specific handler',
    operationId: 'getTicketTypeSummaryForHandler',
  })
  @ApiResponse({
    status: 200,
    type: TicketTypeSummary,
  })
  async typeSummaryForHandler(
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
    summary: 'Ticket closed series for a handler',
    description:
      'Get a time series of closed tickets for a given date range for a specific handler',
    operationId: 'getTicketClosedSeriesForHandler',
  })
  @ApiResponse({
    status: 200,
    type: [TicketClosedPoint],
  })
  async closedSeriesForHandler(
    @Param('handlerId') handlerId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketClosedPoint[]> {
    return this.ticketMetricService.closedSeries(
      range,
      new TicketClosedUserQuery({ handlerId }),
    );
  }

  @Get('activity/summary')
  @ApiOperation({
    summary: 'Ticket activity summary',
    description:
      'Get a summary of ticket activity per hour for a given date range',
    operationId: 'getTicketActivitySummary',
  })
  @ApiResponse({
    status: 200,
    type: [TicketActivityPoint],
  })
  async activitySummary(
    @Query() range?: PartialDateRange,
  ): Promise<TicketActivityPoint[]> {
    return this.ticketMetricService.activitySummary(range);
  }

  @Get('activity/summary/handler/:claimantId')
  @ApiOperation({
    summary: 'Ticket activity summary for a handler',
    description:
      'Get a summary of ticket activity per hour for a given date range for a specific handler',
    operationId: 'getTicketActivitySummaryForHandler',
  })
  @ApiResponse({
    status: 200,
    type: [TicketActivityPoint],
  })
  async activitySummaryForHandler(
    @Param('claimantId') claimantId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketActivityPoint[]> {
    return this.ticketMetricService.activitySummary(
      range,
      new TicketActivityUserQuery({ claimantId }),
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

  @Get('handler/summary')
  @ApiOperation({
    summary: 'Handler summary',
    description:
      'Get a summary of the top 20 ticket handlers (claimed and handled tickets) for a given date range',
    operationId: 'getHandlerSummary',
  })
  @ApiResponse({
    status: 200,
    type: [TicketHandlerSummary],
  })
  async handlerSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
  ): Promise<TicketHandlerSummary[]> {
    return this.ticketMetricService.handlerSummary(range, pages);
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
    type: [TicketReporterSummary],
  })
  async reporterSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
  ): Promise<TicketReporterSummary[]> {
    return this.ticketMetricService.reporterSummary(range, pages);
  }
}
