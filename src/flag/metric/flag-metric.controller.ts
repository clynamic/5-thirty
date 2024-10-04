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

import { PostDeletedUserQuery } from './flag-metric.dto';
import { FlagMetricService } from './flag-metric.service';

@ApiTags('Flags')
@Controller('metrics/flags')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class FlagMetricController {
  constructor(private readonly flagMetricService: FlagMetricService) {}

  @Get('deletion/series')
  @ApiOperation({
    summary: 'Post deletion series',
    description:
      'Get a time series of post deletion counts for a given date range',
    operationId: 'getDeletionSeries',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async deletionSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionSeries(range);
  }

  @Get('deletion/series/by/deleter/:userId')
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
  async deletionSeriesByDeleter(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionSeries(
      range,
      new PostDeletedUserQuery({ creatorId: userId }),
    );
  }

  @Get('deletion/activity/summary')
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
  async deletionActivitySummary(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionActivitySummary(range);
  }

  @Get('deletion/activity/summary/by/deleter/:userId')
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
  async deletionActivitySummaryByDeleter(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionActivitySummary(
      range,
      new PostDeletedUserQuery({ creatorId: userId }),
    );
  }
}
