import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostReplacement, postReplacements } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
import {
  convertKeysToCamelCase,
  DateRange,
  findContiguityGaps,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  getIdRangeString,
  LoopGuard,
  PartialDateRange,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestService } from 'src/manifest/manifest.service';

import {
  PostReplacementCacheEntity,
  PostReplacementEntity,
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

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              const rangeString = dateRange.toE621RangeString();
              const idString = getIdRangeString(lowerId, upperId);

              this.logger.log(
                `Fetching post replacements for ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                postReplacements(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': rangeString,
                    'search[id]': idString,
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
                      cache: new PostReplacementCacheEntity(replacement),
                    }),
                ),
              );

              this.logger.log(
                `Found ${result.length} post replacements with ids ${
                  getIdRangeString(
                    findLowestId(result)?.id,
                    findHighestId(result)?.id,
                  ) || 'none'
                } and dates ${
                  new PartialDateRange({
                    startDate: findLowestDate(stored)?.createdAt,
                    endDate: findHighestDate(stored)?.createdAt,
                  }).toE621RangeString() || 'none'
                }`,
              );

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.postReplacements,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                const gaps = findContiguityGaps(results);
                if (gaps.length > 0) {
                  this.logger.warn(
                    `Found ${gaps.length} gaps in ID contiguity: ${JSON.stringify(gaps)},`,
                  );
                }
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
              const idString = getIdRangeString(
                manifest.lowerId,
                manifest.upperId,
              );

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
                      cache: new PostReplacementCacheEntity(replacement),
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