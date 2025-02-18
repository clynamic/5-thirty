import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostReplacement, postReplacements } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  convertKeysToCamelCase,
  DateRange,
  logContiguityGaps,
  logOrderFetch,
  logOrderResult,
  LoopGuard,
  PartialDateRange,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import {
  PostReplacementEntity,
  PostReplacementLabelEntity,
} from '../post-replacement.entity';
import { PostReplacementSyncService } from './post-replacement-sync.service';

@Injectable()
export class PostReplacementSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly postReplacementSyncService: PostReplacementSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(PostReplacementSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  runOrders() {
    this.jobService.add(
      new Job({
        title: 'Post Replacement Orders Sync',
        key: `/${ItemType.postReplacements}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.postReplacements,
            recentlyRange,
          );

          for (const order of orders) {
            const results: PostReplacement[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.postReplacements, order);

              const result = await rateLimit(
                postReplacements(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.postReplacementSyncService.save(
                result.map(
                  (replacement) =>
                    new PostReplacementEntity({
                      ...convertKeysToCamelCase(replacement),
                      label: new PostReplacementLabelEntity(replacement),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.postReplacements, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.postReplacements,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                logContiguityGaps(
                  this.logger,
                  ItemType.postReplacements,
                  stored,
                );
                break;
              }
            }
          }

          await this.manifestService.mergeInRange(
            ItemType.postReplacements,
            recentlyRange,
          );
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  runRefresh() {
    this.jobService.add(
      new Job({
        title: 'Post Replacement Refresh Sync',
        key: `/${ItemType.postReplacements}/refresh`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const manifests = await this.manifestService.list(undefined, {
            type: [ItemType.postReplacements],
          });

          for (const manifest of manifests) {
            let refreshDate = manifest.refreshedAt;

            if (!refreshDate) {
              refreshDate = (
                await this.postReplacementSyncService.firstFromId(
                  manifest.lowerId,
                )
              )?.updatedAt;
            }

            if (!refreshDate) continue;

            const now = new Date();
            const results: PostReplacement[] = [];
            const loopGuard = new LoopGuard();
            let page = 1;

            while (true) {
              cancelToken.ensureRunning();

              const rangeString = new PartialDateRange({
                startDate: refreshDate,
              }).toE621RangeString();
              const idString = manifest.idRange.toE621RangeString();

              this.logger.log(
                `Fetching post replacements for refresh date ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                postReplacements(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': rangeString,
                    'search[id]': idString,
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const updated =
                await this.postReplacementSyncService.countUpdated(
                  result.map(convertKeysToCamelCase),
                );

              await this.postReplacementSyncService.save(
                result.map(
                  (replacement) =>
                    new PostReplacementEntity({
                      ...convertKeysToCamelCase(replacement),
                      label: new PostReplacementLabelEntity(replacement),
                    }),
                ),
              );

              this.logger.log(`Found ${updated} updated post replacements`);

              const exhausted = result.length < MAX_API_LIMIT;

              if (exhausted) break;

              page++;
            }

            await this.manifestService.save({
              id: manifest.id,
              refreshedAt: now,
            });
          }
        },
      }),
    );
  }
}
