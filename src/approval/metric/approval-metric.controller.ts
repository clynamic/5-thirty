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
  ApprovalActivityPoint,
  ApprovalCountPoint,
  ApprovalCountSummary,
  ApprovalCountUserQuery,
  ApproverSummary,
} from './approval-metric.dto';
import { ApprovalMetricService } from './approval-metric.service';

@ApiTags('Approvals')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
@Controller('approvals/metrics')
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
    type: [ApprovalCountPoint],
  })
  async countSeries(
    @Query() range?: PartialDateRange,
  ): Promise<ApprovalCountPoint[]> {
    return this.approvalMetricService.countSeries(range);
  }

  @Get('count/series/:approverId')
  @ApiOperation({
    summary: 'Approval count series by approver',
    description:
      'Get a time series of approval counts for a given date range by approver',
    operationId: 'getApprovalCountSeriesByApprover',
  })
  @ApiResponse({
    status: 200,
    type: [ApprovalCountPoint],
  })
  async countSeriesByApprover(
    @Param('approverId') approverId: number,
    @Query() range?: PartialDateRange,
  ): Promise<ApprovalCountPoint[]> {
    return this.approvalMetricService.countSeries(
      range,
      new ApprovalCountUserQuery({ userId: approverId }),
    );
  }

  @Get('activity/summary')
  @ApiOperation({
    summary: 'Approval activity summary',
    description: 'Get total approval activity counts for a given date range',
    operationId: 'getApprovalActivitySummary',
  })
  @ApiResponse({
    status: 200,
    type: [ApprovalActivityPoint],
  })
  async activitySummary(
    @Query() range?: PartialDateRange,
  ): Promise<ApprovalActivityPoint[]> {
    return this.approvalMetricService.approvalActivity(range);
  }

  @Get('activity/summary/:approverId')
  @ApiOperation({
    summary: 'Approval activity summary by approver',
    description:
      'Get total approval activity counts for a given date range by approver',
    operationId: 'getApprovalActivitySummaryByApprover',
  })
  @ApiResponse({
    status: 200,
    type: [ApprovalActivityPoint],
  })
  async activitySummaryByApprover(
    @Param('approverId') approverId: number,
    @Query() range?: PartialDateRange,
  ): Promise<ApprovalActivityPoint[]> {
    return this.approvalMetricService.approvalActivity(
      range,
      new ApprovalCountUserQuery({ userId: approverId }),
    );
  }

  @Get('approver/summary')
  @ApiOperation({
    summary: 'Approver summary',
    description:
      'Get a summary of the top 20 approvers by approval count for a given date range',
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
