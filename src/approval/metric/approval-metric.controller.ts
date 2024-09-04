import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  ApprovalCountPoint,
  ApprovalCountSummary,
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
