import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';
import { PartialDateRange, SeriesCountPoint } from 'src/common';

import { PostStatusSummary } from './post-metric.dto';
import { PostMetricService } from './post-metric.service';

@ApiTags('Posts')
@Controller('metrics/posts')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class PostMetricController {
  constructor(private readonly postMetricService: PostMetricService) {}

  @Get('status/summary')
  @ApiOperation({
    summary: 'Post status summary',
    description:
      'Get post status (approved, deleted, permitted) counts for a given date range',
    operationId: 'getPostStatusSummary',
  })
  @ApiResponse({
    status: 200,
    type: PostStatusSummary,
  })
  async statusSummary(
    @Query() range?: PartialDateRange,
  ): Promise<PostStatusSummary> {
    return this.postMetricService.statusSummary(range);
  }

  @Get('pending/series')
  @ApiOperation({
    summary: 'Post pending series',
    description: 'Get post pending series for a given date range',
    operationId: 'getPostPendingSeries',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async pendingSeries(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.postMetricService.pendingSeries(range);
  }
}
