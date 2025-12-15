import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FunkyCronExpression } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';

import { UploadTilesEntity } from './upload-tiles.entity';
import { UploadTilesService } from './upload-tiles.service';

@Injectable()
export class UploadTilesWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly uploadTilesService: UploadTilesService,
  ) {}

  private readonly logger = new Logger(UploadTilesWorker.name);

  @Cron(FunkyCronExpression.EVERY_3_MINUTES)
  async runTiling() {
    this.jobService.add(
      new Job({
        title: 'Post Uploads Tiling',
        key: `/uploads/tiles`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const ranges = await this.uploadTilesService.getRanges();

          if (ranges.length === 0) return;

          for (const { dateRange, updatedAt } of ranges) {
            cancelToken.ensureRunning();

            const targets = await this.uploadTilesService.findMissing({
              dateRange,
              updatedAt,
            });

            if (targets.length === 0) continue;

            this.logger.log(
              `Generating ${targets.length} tiles for ${dateRange.toE621RangeString()}`,
            );

            cancelToken.ensureRunning();

            const tileData = await this.uploadTilesService.generate(targets);

            const tilesToSave = targets.map((time) => {
              const data = tileData.get(time.toISOString());
              return new UploadTilesEntity({
                time,
                count: data?.count ?? 0,
              });
            });

            await this.uploadTilesService.upsert(tilesToSave);
          }
        },
      }),
    );
  }
}
