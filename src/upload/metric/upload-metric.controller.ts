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

import { PostUploadSeriesQuery } from './upload-metric.dto';
import { UploadMetricService } from './upload-metric.service';

@ApiTags('Uploads')
@Controller('metrics/uploads')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class UploadMetricController {
  constructor(private readonly uploadMetricService: UploadMetricService) {}

  @Get('count')
  @ApiOperation({
    summary: 'Upload series',
    description: 'Get a time series of upload counts for a given date range',
    operationId: 'getUploadCount',
  })
  @ApiResponse({
    status: 200,
    type: SeriesCountPoint,
    isArray: true,
  })
  async count(
    @Query() range?: PartialDateRange,
    @Query() query?: PostUploadSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    return this.uploadMetricService.count(range, query);
  }
}
