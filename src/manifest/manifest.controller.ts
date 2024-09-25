import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServerAdminGuard } from 'src/auth/auth.guard';
import { DateRange } from 'src/utils';

import { Manifest, ManifestQuery } from './manifest.dto';
import { ManifestService } from './manifest.service';

@ApiTags('Manifest')
@Controller('manifests')
@UseGuards(ServerAdminGuard)
@ApiBearerAuth()
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get a manifest by ID',
    description: 'Get a manifest by ID',
    operationId: 'getManifest',
  })
  @ApiResponse({
    status: 200,
    description: 'Manifest',
    type: Manifest,
  })
  async get(@Param('id') id: number) {
    const result = await this.manifestService.get(id);
    if (!result) throw new NotFoundException();
    return new Manifest(result);
  }

  @Get()
  @ApiOperation({
    summary: 'List manifests',
    description: 'List manifests',
    operationId: 'listManifests',
  })
  @ApiResponse({
    status: 200,
    description: 'List of manifests',
    type: [Manifest],
  })
  async list(
    @Query('range') range?: DateRange,
    @Query('query') query?: ManifestQuery,
  ) {
    return this.manifestService
      .list(range, query)
      .then((result) => result.map((item) => new Manifest(item)));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a manifest by ID',
    description: 'Delete a manifest by ID',
    operationId: 'deleteManifest',
  })
  @ApiResponse({
    status: 200,
    description: 'Manifest deleted successfully',
  })
  async delete(@Param('id') id: number) {
    const item = await this.manifestService.get(id);
    if (!item) return;
    return this.manifestService.remove([item]);
  }
}
