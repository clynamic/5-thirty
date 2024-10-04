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
} from 'src/utils';

import {
  ApprovalCountSummary,
  ApprovalCountUserQuery,
  ApproverSummary,
} from './approval-metric.dto';
import { ApprovalMetricService } from './approval-metric.service';

@ApiTags('Approvals')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
@Controller('metrics/approvals')
export class ApprovalMetricController {
  constructor(private readonly approvalMetricService: ApprovalMetricService) {}

  @Get('count/summary')
  @ApiOperation({
    summary: 'Approval count summary',
    description: 'Get total approval counts for a given date range',
    operationId: 'getApprovalCountSummary',
  })
  @ApiResponse({
    status: 200,
    type: ApprovalCountSummary,
  })
  async countSummary(
    @Query() range?: PartialDateRange,
  ): Promise<ApprovalCountSummary> {
    return this.approvalMetricService.countSummary(range);
  }

  @Get('count/series')
  @ApiOperation({
    summary: 'Approval count series',
    description: 'Get a time series of approval counts for a given date range',
    operationId: 'getApprovalCountSeries',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async countSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.approvalMetricService.countSeries(range);
  }

  @Get('count/series/by/approver/:approverId')
  @ApiOperation({
    summary: 'Approval count series by approver',
    description:
      'Get a time series of approval counts for a given date range by approver',
    operationId: 'getApprovalCountSeriesByApprover',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async countSeriesByApprover(
    @Param('approverId') approverId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.approvalMetricService.countSeries(
      range,
      new ApprovalCountUserQuery({ userId: approverId }),
    );
  }

  @Get('activity/summary')
  @ApiOperation({
    summary: 'Approval activity summary',
    description:
      'Get a hourly summary of approval activity for a given date range',
    operationId: 'getApprovalActivitySeries',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async activitySummary(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.approvalMetricService.activitySummary(range);
  }

  @Get('activity/summary/by/approver/:approverId')
  @ApiOperation({
    summary: 'Approval activity summary by approver',
    description:
      'Get a hourly summary of approval activity for a given date range by approver',
    operationId: 'getApprovalActivitySummaryByApprover',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async activitySummaryByApprover(
    @Param('approverId') approverId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.approvalMetricService.activitySummary(
      range,
      new ApprovalCountUserQuery({ userId: approverId }),
    );
  }

  @Get('approver/summary')
  @ApiOperation({
    summary: 'Approver summary',
    description:
      'Get a summary of approvals by approver for a given date range',
    operationId: 'getApproverSummary',
  })
  @ApiResponse({
    status: 200,
    type: [ApproverSummary],
  })
  async approverSummary(
    @Query() range?: PartialDateRange,
    @Query() pages?: PaginationParams,
  ): Promise<ApproverSummary[]> {
    return this.approvalMetricService.approverSummary(range, pages);
  }
}
