import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import {
  PaginationParams,
  PartialDateRange,
  SeriesCountPoint,
  RequestContext,
  RequestCtx,
  WithRequestContext,
} from 'src/common';
import { UserHeadService } from 'src/user/head/user-head.service';

import {
  TicketAgeSeriesPoint,
  TicketAgeSummary,
  TicketClosedSeriesQuery,
  TicketCreatedSeriesQuery,
  TicketHandlerSummary,
  TicketReporterSummary,
  TicketStatusSeriesPoint,
  TicketTypeSummary,
  TicketTypeSummaryQuery,
} from './ticket-metric.dto';
import { TicketMetricService } from './ticket-metric.service';

@ApiTags('Tickets')
@Controller('metrics/tickets')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class TicketMetricController {
  constructor(
    private readonly ticketMetricService: TicketMetricService,
    private readonly userHeadService: UserHeadService,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Ticket status',
    description:
      'Get ticket status (pending, approved, partial) counts for a given date range',
    operationId: 'getTicketStatus',
  })
  @ApiResponse({
    status: 200,
    type: [TicketStatusSeriesPoint],
  })
  async statusSummary(
    @Query() range?: PartialDateRange,
  ): Promise<TicketStatusSeriesPoint[]> {
    return this.ticketMetricService.status(range);
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

  @Get('type/summary/by/handler/:claimantId')
  @ApiOperation({
    summary: 'Ticket type summary for a handler',
    description:
      'Get ticket types counts for a given date range for a specific handler',
    operationId: 'getTicketTypeSummaryByHandler',
  })
  @ApiResponse({
    status: 200,
    type: TicketTypeSummary,
  })
  async typeSummaryByHandler(
    @Param('claimantId') claimantId: number,
    @Query() range?: PartialDateRange,
  ): Promise<TicketTypeSummary> {
    return this.ticketMetricService.typeSummary(
      range,
      new TicketTypeSummaryQuery({ claimantId }),
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
    type: [SeriesCountPoint],
  })
  async openSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
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
    type: [SeriesCountPoint],
  })
  async createdSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.ticketMetricService.createdSeries(range);
  }

  @Get('created/series/by/reporter/:repoterId')
  @ApiOperation({
    summary: 'Ticket created series by reporter',
    description:
      'Get a time series of created tickets for a given date range for a specific reporter',
    operationId: 'getTicketCreatedSeriesByReporter',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async createdSeriesByReporter(
    @Param('repoterId') reporterId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.ticketMetricService.createdSeries(
      range,
      new TicketCreatedSeriesQuery({ creatorId: reporterId }),
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
    type: [SeriesCountPoint],
  })
  async closedSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.ticketMetricService.closedSeries(range);
  }

  @Get('closed/series/by/handler/:handlerId')
  @ApiOperation({
    summary: 'Ticket closed series by handler',
    description:
      'Get a time series of closed tickets for a given date range for a specific handler',
    operationId: 'getTicketClosedSeriesByHandler',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async closedSeriesForHandler(
    @Param('handlerId') handlerId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.ticketMetricService.closedSeries(
      range,
      new TicketClosedSeriesQuery({ handlerId }),
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
      'Get a summary of ticket handling counts for a given date range',
    operationId: 'getTicketHandlerSummary',
  })
  @WithRequestContext()
  @ApiResponse({
    status: 200,
    type: [TicketHandlerSummary],
  })
  async handlerSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
    @RequestCtx() context?: RequestContext,
  ): Promise<TicketHandlerSummary[]> {
    const summaries = await this.ticketMetricService.handlerSummary(
      range,
      pages,
    );

    const userIds = summaries.map((summary) => summary.userId);
    const heads =
      userIds.length > 0
        ? await this.userHeadService.get(userIds, context)
        : [];

    return summaries.map((summary) => ({
      ...summary,
      head: heads.find((head) => head.id === summary.userId),
    }));
  }

  @Get('reporter/summary')
  @ApiOperation({
    summary: 'Reporter summary',
    description:
      'Get a summary of ticket reporting counts for a given date range',
    operationId: 'getTicketReporterSummary',
  })
  @WithRequestContext()
  @ApiResponse({
    status: 200,
    type: [TicketReporterSummary],
  })
  async reporterSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
    @RequestCtx() context?: RequestContext,
  ): Promise<TicketReporterSummary[]> {
    const summaries = await this.ticketMetricService.reporterSummary(
      range,
      pages,
    );

    const userIds = summaries.map((summary) => summary.userId);
    const heads =
      userIds.length > 0
        ? await this.userHeadService.get(userIds, context)
        : [];

    return summaries.map((summary) => ({
      ...summary,
      head: heads.find((head) => head.id === summary.userId),
    }));
  }
}
