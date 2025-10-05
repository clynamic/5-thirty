import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServerAdminGuard } from 'src/auth/auth.guard';
import { PaginationParams } from 'src/common/pagination.dto';

import { ManifestHealth } from './manifest-health.dto';
import { ManifestHealthService } from './manifest-health.service';

@ApiTags('Health')
@Controller('health/manifests')
export class ManifestHealthController {
  constructor(private readonly manifestHealthService: ManifestHealthService) {}

  @Get()
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
    return this.manifestHealthService.manifests(pages);
  }
}
