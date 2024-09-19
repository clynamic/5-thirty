import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import { PartialDateRange } from 'src/utils';

import { PostDeletedPoint, PostDeletedUserQuery } from './flag-metric.dto';
import { FlagMetricService } from './flag-metric.service';

@ApiTags('Flags')
@Controller('flags/metric')
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
    type: [PostDeletedPoint],
  })
  async deletionSeries(
    @Query() range?: PartialDateRange,
  ): Promise<PostDeletedPoint[]> {
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
    type: [PostDeletedPoint],
  })
  async deletionSeriesByUser(
    @Param('userId') userId: number,
    @Query() range?: PartialDateRange,
  ): Promise<PostDeletedPoint[]> {
    return this.flagMetricService.deletionSeries(
      range,
      new PostDeletedUserQuery({ creatorId: userId }),
    );
  }
}
