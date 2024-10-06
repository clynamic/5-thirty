import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import { PartialDateRange, SeriesCountPoint } from 'src/utils';

import {
  DeletionActivitySummaryQuery,
  DeletionCountSeriesQuery,
} from './deletion-metric.dto';
import { DeletionMetricService } from './deletion-metric.service';

@ApiTags('Deletions')
@Controller('metrics/deletions')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class DeletionMetricController {
  constructor(private readonly deletionMetricService: DeletionMetricService) {}

  @Get('count/series')
  @ApiOperation({
    summary: 'Post deletion series',
    description:
      'Get a time series of post deletion counts for a given date range',
    operationId: 'getDeletionCountSeries',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async countSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.deletionMetricService.countSeries(range);
  }

  @Get('count/series/by/deleter/:userId')
  @ApiOperation({
    summary: 'Post deletion series by deleter',
    description:
      'Get a time series of post deletion counts for a given date range by deleter',
    operationId: 'getDeletionSeriesByDeleter',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async countSeriesByDeleter(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.deletionMetricService.countSeries(
      range,
      new DeletionCountSeriesQuery({ creatorId: userId }),
    );
  }

  @Get('activity/summary')
  @ApiOperation({
    summary: 'Post deletion activity summary',
    description:
      'Get a hourly summary of post deletion counts for a given date range',
    operationId: 'getDeletionActivitySummary',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async activitySummary(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.deletionMetricService.activitySummary(range);
  }

  @Get('activity/summary/by/deleter/:userId')
  @ApiOperation({
    summary: 'Post deletion activity summary by deleter',
    description:
      'Get a hourly summary of post deletion counts for a given date range by deleter',
    operationId: 'getDeletionActivitySummaryByDeleter',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async activitySummaryByDeleter(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.deletionMetricService.activitySummary(
      range,
      new DeletionActivitySummaryQuery({ creatorId: userId }),
    );
  }
}
