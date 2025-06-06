import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import { PartialDateRange } from 'src/common';

import {
  ActivitySeriesPoint,
  ActivitySummaryQuery,
  PerformanceSummary,
  PerformanceSummaryQuery,
} from './performance-metric.dto';
import { PerformanceMetricService } from './performance-metric.service';

@ApiTags('Performance')
@Controller('metrics/performance')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class PerformanceMetricController {
  constructor(
    private readonly performanceMetricService: PerformanceMetricService,
  ) {}

  @Get('performance')
  @ApiOperation({
    summary: 'Performance',
    description: 'Get performance data for an area.',
    operationId: 'getPerformance',
  })
  @ApiResponse({
    status: 200,
    type: [PerformanceSummary],
  })
  async performance(
    @Query() range?: PartialDateRange,
    @Query() query?: PerformanceSummaryQuery,
  ): Promise<PerformanceSummary[]> {
    return this.performanceMetricService.performance(range, query);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Activity',
    description: 'Get activity data for the specified range, scale, and cycle.',
    operationId: 'getActivity',
  })
  @ApiResponse({
    status: 200,
    type: [ActivitySeriesPoint],
  })
  async activity(
    @Query() range?: PartialDateRange,
    @Query() query?: ActivitySummaryQuery,
  ): Promise<ActivitySeriesPoint[]> {
    return this.performanceMetricService.activity(range, query);
  }
}
