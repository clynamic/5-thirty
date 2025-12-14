import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';

import { PostPendingTilesEntity } from './post-pending-tiles.entity';
import { PostPendingTilesService } from './post-pending-tiles.service';

@Injectable()
export class PostPendingTilesWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly postPendingTilesService: PostPendingTilesService,
  ) {}

  private readonly logger = new Logger(PostPendingTilesWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runTiling() {
    this.jobService.add(
      new Job({
        title: 'Post Pending Tiling',
        key: `/posts/pending/tiles`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const ranges = await this.postPendingTilesService.getRanges();

          if (ranges.length === 0) return;

          for (const { dateRange, updatedAt } of ranges) {
            cancelToken.ensureRunning();

            const targets = await this.postPendingTilesService.findMissing({
              dateRange,
              updatedAt,
            });

            if (targets.length === 0) continue;

            this.logger.log(
              `Generating ${targets.length} tiles for ${dateRange.toE621RangeString()}`,
            );

            cancelToken.ensureRunning();

            const tileData =
              await this.postPendingTilesService.generate(targets);

            const tilesToSave = targets.map((time) => {
              const data = tileData.get(time.toISOString());
              return new PostPendingTilesEntity({
                time,
                count: data?.count ?? 0,
              });
            });

            await this.postPendingTilesService.upsert(tilesToSave);
          }
        },
      }),
    );
  }
}
