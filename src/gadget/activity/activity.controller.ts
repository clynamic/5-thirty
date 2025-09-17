import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { DailyActivity } from './activity.dto';
import { ActivityService } from './activity.service';

@ApiTags('Gadgets')
@Controller('gadgets')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('activity')
  @ApiOperation({
    summary: "Get today's activity counter",
    description: "Returns today's activity counter",
    operationId: 'getDailyActivity',
  })
  @ApiResponse({
    status: 200,
    description: "Today's activity counter",
    type: DailyActivity,
  })
  async getDailyActivity(): Promise<DailyActivity> {
    return this.activityService.getDailyActivity();
  }
}
