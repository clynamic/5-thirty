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
  FeedbackCountSeriesPoint,
  FeedbackTypeSummary,
} from './feedback-metric.dto';
import { FeedbackMetricService } from './feedback-metric.service';

@ApiTags('Feedbacks')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
@Controller('metrics/feedbacks')
export class FeedbackMetricController {
  constructor(private readonly feedbackMetricService: FeedbackMetricService) {}

  @Get('type/summary')
  @ApiOperation({
    summary: 'Feedback type summary',
    description: 'Get feedback types counts for a given date range',
    operationId: 'getFeedbackTypeSummary',
  })
  @ApiResponse({
    status: 200,
    type: FeedbackTypeSummary,
  })
  async typeSummary(
    @Query() range?: PartialDateRange,
  ): Promise<FeedbackTypeSummary> {
    return this.feedbackMetricService.typeSummary(range);
  }

  @Get('count/series')
  @ApiOperation({
    summary: 'Feedback count series',
    description: 'Get a time series of feedback counts for a given date range',
    operationId: 'getFeedbackCountSeries',
  })
  @ApiResponse({
    status: 200,
    type: [FeedbackCountSeriesPoint],
  })
  async countSeries(
    @Query() range?: PartialDateRange,
  ): Promise<FeedbackCountSeriesPoint[]> {
    return this.feedbackMetricService.countSeries(range);
  }
}
