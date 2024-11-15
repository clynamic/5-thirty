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

import { PermitMetricService } from './permit-metric.service';

@ApiTags('Permits')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
@Controller('metrics/permits')
export class PermitMetricController {
  constructor(private readonly permitMetricService: PermitMetricService) {}

  @Get('count')
  @ApiOperation({
    summary: 'Get total permit counts for a given date range',
    description: 'Get total permit counts for a given date range',
    operationId: 'getPermitCount',
  })
  @ApiResponse({
    status: 200,
    type: [SeriesCountPoint],
  })
  async count(@Query() range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    return this.permitMetricService.count(range);
  }
}
