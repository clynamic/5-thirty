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
  FeedbackTypeQuery,
  FeedbackTypeSeriesPoint,
} from './feedback-metric.dto';
import { FeedbackMetricService } from './feedback-metric.service';

@ApiTags('Feedbacks')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
@Controller('metrics/feedbacks')
export class FeedbackMetricController {
  constructor(private readonly feedbackMetricService: FeedbackMetricService) {}

  @Get('type')
  @ApiOperation({
    summary: 'Feedback Type Series',
    description: 'Get a time series of feedback types counts for a given range',
    operationId: 'getFeedbackTypeSeries',
  })
  @ApiResponse({
    status: 200,
    type: [FeedbackTypeSeriesPoint],
  })
  async countSeries(
    @Query() range?: PartialDateRange,
    @Query() query?: FeedbackTypeQuery,
  ): Promise<FeedbackTypeSeriesPoint[]> {
    return this.feedbackMetricService.type(range, query);
  }
}
