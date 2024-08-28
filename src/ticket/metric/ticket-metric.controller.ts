import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketMetricService } from './ticket-metric.service';
import {
  TicketStatusSummary,
  TicketTypeSummary,
  TicketOpenSeries,
  TicketClosedSeries,
  ModSummary,
  ReporterSummary,
} from './ticket-metric.dto';

@ApiTags('Tickets')
@Controller('tickets/metrics')
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
  async statusSummary(): Promise<TicketStatusSummary> {
    return this.ticketMetricService.statusSummary();
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
  async typeSummary(): Promise<TicketTypeSummary> {
    return this.ticketMetricService.typeSummary();
  }

  @Get('open/series')
  @ApiOperation({
    summary: 'Ticket open series',
    description: 'Get a time series of open tickets for a given date range',
    operationId: 'getTicketOpenSeries',
  })
  @ApiResponse({
    status: 200,
    type: TicketOpenSeries,
  })
  async openSeries(): Promise<TicketOpenSeries> {
    return this.ticketMetricService.openSeries();
  }

  @Get('closed/series')
  @ApiOperation({
    summary: 'Ticket closed series',
    description: 'Get a time series of closed tickets for a given date range',
    operationId: 'getTicketClosedSeries',
  })
  @ApiResponse({
    status: 200,
    type: TicketClosedSeries,
  })
  async closedSeries(): Promise<TicketClosedSeries> {
    return this.ticketMetricService.closedSeries();
  }

  @Get('mod/summary')
  @ApiOperation({
    summary: 'Moderator summary',
    description:
      'Get a summary of moderator activity (claimed and handled tickets) for a given date range',
    operationId: 'getModSummary',
  })
  @ApiResponse({
    status: 200,
    type: [ModSummary],
  })
  async modSummary(): Promise<ModSummary[]> {
    return this.ticketMetricService.modSummary();
  }

  @Get('reporter/summary')
  @ApiOperation({
    summary: 'Reporter summary',
    description: 'Get a summary of reporter activity for a given date range',
    operationId: 'getReporterSummary',
  })
  @ApiResponse({
    status: 200,
    type: [ReporterSummary],
  })
  async reporterSummary(): Promise<ReporterSummary[]> {
    return this.ticketMetricService.reporterSummary();
  }
}
