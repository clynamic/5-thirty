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
@Controller('flags/metric')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class FlagMetricController {
  constructor(private readonly flagMetricService: FlagMetricService) {}

  @Get('deletion/activity/summary')
  @ApiOperation({
    summary: 'Post deletion activity summary',
    description: 'Get total post deletion counts for a given date range',
    operationId: 'getDeletionActivitySummary',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async deletionActivity(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionActivity(range);
  }

  @Get('deletion/activity/summary/:userId')
  @ApiOperation({
    summary: 'Post deletion activity summary by deleter',
    description:
      'Get total post deletion counts for a given date range by deleter',
    operationId: 'getDeletionActivitySummaryByDeleter',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async deletionActivityByDeleter(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionActivity(
      range,
      new PostDeletedUserQuery({ creatorId: userId }),
    );
  }

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

  @Get('deletion/series/:userId')
  @ApiOperation({
    summary: 'Post deletion series by user',
    description:
      'Get a time series of post deletion counts for a given date range by user',
    operationId: 'getDeletionSeriesByUser',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async deletionSeriesByUser(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.flagMetricService.deletionSeries(
      range,
      new PostDeletedUserQuery({ creatorId: userId }),
    );
  }
}
