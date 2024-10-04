import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServerAdminGuard } from 'src/auth/auth.guard';
import { PaginationParams } from 'src/utils';

import { JobInfo } from './job.dto';
import { JobService } from './job.service';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(ServerAdminGuard)
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all jobs',
    description:
      'Returns a list of all jobs that have been queued or processed.',
    operationId: 'getJobs',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of all jobs',
    type: [JobInfo],
  })
  async getJobs(@Query() pages?: PaginationParams): Promise<JobInfo[]> {
    return this.jobService.list(pages);
  }
}
