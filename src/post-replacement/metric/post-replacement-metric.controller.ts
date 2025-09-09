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

import { PostReplacementStatusPoint } from './post-replacement-metric.dto';
import { PostReplacementMetricService } from './post-replacement-metric.service';

@ApiTags('Replacements')
@Controller('metrics/post-replacements')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class PostReplacementMetricController {
  constructor(
    private readonly postReplacementMetricService: PostReplacementMetricService,
  ) {}

  @Get('created')
  @ApiOperation({
    summary: 'Post replacements created',
    description: 'Get post replacements created counts for a given date range',
    operationId: 'getPostReplacementCreated',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async created(
    @Query() range?: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.postReplacementMetricService.created(range);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Post replacement status',
    description:
      'Get post replacement status (pending, approved, partial) counts for a given date range',
    operationId: 'getPostReplacementStatus',
  })
  @ApiResponse({
    status: 200,
    type: [PostReplacementStatusPoint],
  })
  async status(
    @Query() range?: PartialDateRange,
  ): Promise<PostReplacementStatusPoint[]> {
    return this.postReplacementMetricService.status(range);
  }
}
