import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServerAdminGuard } from 'src/auth/auth.guard';
import { PaginationParams } from 'src/common/pagination.dto';

import { ManifestHealth } from './health.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check the health of the application',
    operationId: 'healthCheck',
  })
  @ApiResponse({
    status: 200,
    description: 'The application is healthy',
  })
  async healthCheck(): Promise<string> {
    return 'OK';
  }

  @Get('manifests')
  @ApiOperation({
    summary: 'Retrieve manifest health',
    description: 'Retrieve manifest health',
    operationId: 'getManifestHealth',
  })
  @ApiResponse({
    status: 200,
    description: 'Manifest health',
    type: [ManifestHealth],
  })
  @UseGuards(ServerAdminGuard)
  @ApiBearerAuth()
  async getManifestHealth(
    @Query() pages?: PaginationParams,
  ): Promise<ManifestHealth[]> {
    return this.healthService.getManifestHealth(pages);
  }
}
