import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import {
  PartialDateRange,
  RequestContext,
  RequestCtx,
  WithRequestContext,
} from 'src/common';
import { UserHeadService } from 'src/user/head/user-head.service';

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
    private readonly userHeadService: UserHeadService,
  ) {}

  @Get('performance')
  @ApiOperation({
    summary: 'Performance',
    description: 'Get performance data for an area.',
    operationId: 'getPerformance',
  })
  @WithRequestContext()
  @ApiResponse({
    status: 200,
    type: [PerformanceSummary],
  })
  async performance(
    @Query() range?: PartialDateRange,
    @Query() query?: PerformanceSummaryQuery,
    @RequestCtx() context?: RequestContext,
  ): Promise<PerformanceSummary[]> {
    const summaries = await this.performanceMetricService.performance(
      range,
      query,
    );

    if (query?.head) {
      const userIds = summaries.map((summary) => summary.userId);
      const fetchMissing = query?.userId !== undefined;
      const heads =
        userIds.length > 0
          ? await this.userHeadService.get(userIds, {
              fetchMissing,
              ...context,
            })
          : [];

      return summaries.map<PerformanceSummary>((summary) => ({
        ...summary,
        head: heads.find((head) => head.id === summary.userId),
      }));
    }

    return summaries;
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
