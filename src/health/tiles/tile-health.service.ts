import { Injectable } from '@nestjs/common';
import { Cacheable } from 'src/app/browser.module';
import {
  PaginationParams,
  PartialDateRange,
  TileService,
  TileType,
} from 'src/common';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { UploadTilesEntity } from 'src/upload/tiles/upload-tiles.entity';
import { UploadTilesService } from 'src/upload/tiles/upload-tiles.service';

import { TileHealth } from './tile-health.dto';
import { generateTileSlices } from './tile-health.utils';

@Injectable()
export class TileHealthService {
  constructor(private readonly uploadTilesService: UploadTilesService) {}

  private tileServices: Partial<Record<TileType, TileService>> = {
    [TileType.uploadHourly]: this.uploadTilesService,
  };

  @Cacheable({
    prefix: 'tile-health',
    ttl: 15 * 60 * 1000,
    dependencies: [ManifestEntity, UploadTilesEntity],
  })
  async tiles(pages?: PaginationParams): Promise<TileHealth[]> {
    const health: TileHealth[] = [];
    pages = new PaginationParams({
      limit: 5,
      ...pages,
    });

    const tileTypes = Object.values(TileType).slice(
      PaginationParams.calculateOffset(pages),
      PaginationParams.calculateOffset(pages) + (pages.limit || 5),
    );

    for (const tileType of tileTypes) {
      const service = this.tileServices[tileType];
      if (!service) continue;

      const ranges = await service.getRanges();
      if (ranges.length === 0) continue;

      for (const range of ranges) {
        const { startDate, endDate } = range.dateRange;

        const totalHours = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
        );
        const expected = Math.ceil(totalHours / service.interval);

        const missingTimes = await service.findMissing(range);
        const actual = expected - missingTimes.length;

        const slices = generateTileSlices({
          allTimes: missingTimes.map((time) => ({ time })),
          startDate,
          endDate,
          intervalHours: service.interval,
        });

        health.push(
          new TileHealth({
            type: tileType,
            startDate,
            endDate,
            expected,
            actual,
            slices,
          }),
        );
      }
    }

    return health;
  }

  async deleteTilesByType(
    tileType: TileType,
    range?: PartialDateRange,
  ): Promise<void> {
    const service = this.tileServices[tileType];
    if (!service) {
      throw new Error(`No service found for tile type: ${tileType}`);
    }

    await service.wipe(range);
  }
}
