import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServerAdminGuard } from 'src/auth/auth.guard';
import { PartialDateRange, TileType } from 'src/common';
import { PaginationParams } from 'src/common/pagination.dto';

import { TileHealth } from './tile-health.dto';
import { TileHealthService } from './tile-health.service';

@ApiTags('Health')
@Controller('health/tiles')
export class TileHealthController {
  constructor(private readonly tileHealthService: TileHealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve tile health',
    description: 'Retrieve tile health and coverage information',
    operationId: 'getTileHealth',
  })
  @ApiResponse({
    status: 200,
    description: 'Tile health information',
    type: [TileHealth],
  })
  @UseGuards(ServerAdminGuard)
  @ApiBearerAuth()
  async getTileHealth(
    @Query() pages?: PaginationParams,
  ): Promise<TileHealth[]> {
    return this.tileHealthService.tiles(pages);
  }

  // TODO: This is kind of awkward, being handled in the health controller.
  @Delete(':type')
  @ApiOperation({
    summary: 'Delete all tiles of a type',
    description: 'Delete all tiles of the specified type',
    operationId: 'deleteTilesByType',
  })
  @ApiParam({
    name: 'type',
    enum: TileType,
    description: 'The type of tiles to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Tiles deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'number',
          description: 'Number of tiles deleted',
        },
      },
    },
  })
  @UseGuards(ServerAdminGuard)
  @ApiBearerAuth()
  async deleteTilesByType(
    @Param('type') type: TileType,
    @Query() range?: PartialDateRange,
  ): Promise<void> {
    return this.tileHealthService.deleteTilesByType(type, range);
  }
}
