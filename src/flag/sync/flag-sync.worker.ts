import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostFlag, postFlags } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { CacheManager } from 'src/app/browser.module';
import { AuthService } from 'src/auth/auth.service';
import {
  DateRange,
  LoopGuard,
  PartialDateRange,
  convertKeysToCamelCase,
  logContiguityGaps,
  logOrderFetch,
  logOrderResult,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import { FlagEntity, FlagLabelEntity } from '../flag.entity';
import { FlagSyncService } from './flag-sync.service';

@Injectable()
export class FlagSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly flagSyncService: FlagSyncService,
    private readonly manifestService: ManifestService,
    private readonly cacheManager: CacheManager,
  ) {}

  private readonly logger = new Logger(FlagSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Flag Orders Sync',
        key: `/${ItemType.flags}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.flags,
            recentlyRange,
          );

          for (let order of orders) {
            const results: PostFlag[] = [];
            const loopGuard = new LoopGuard();
            const inPast = order.inPast;

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order.ranges;

              logOrderFetch(this.logger, ItemType.flags, order);

              const result = await rateLimit(
                postFlags(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.flagSyncService.save(
                result.map(
                  (flag) =>
                    new FlagEntity({
                      ...convertKeysToCamelCase(flag),
                      label: new FlagLabelEntity(flag),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.flags, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              order = await this.manifestService.saveResults({
                type: ItemType.flags,
                order,
                items: stored,
                bottom: exhausted,
                top: inPast,
              });

              if (results.length) {
                this.cacheManager.inv(FlagEntity);
              }

              if (exhausted) {
                logContiguityGaps(this.logger, ItemType.flags, results);
                break;
              }
            }
          }
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runRefresh() {
    this.jobService.add(
      new Job({
        title: 'Flag Refresh Sync',
        key: `/${ItemType.flags}/refresh`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const manifests = await this.manifestService.list(undefined, {
            type: [ItemType.flags],
          });

          for (const manifest of manifests) {
            let refreshDate = manifest.refreshedAt;

            if (!refreshDate) {
              refreshDate = (
                await this.flagSyncService.firstFromId(manifest.lowerId)
              )?.updatedAt;
            }

            if (!refreshDate) continue;

            const now = new Date();
            const loopGuard = new LoopGuard();
            let page = 1;

            while (true) {
              cancelToken.ensureRunning();

              const rangeString = new PartialDateRange({
                startDate: refreshDate,
              }).toE621RangeString();
              const idString = manifest.idRange.toE621RangeString();

              this.logger.log(
                `Fetching flags for refresh date ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                postFlags(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': rangeString,
                    'search[id]': idString,
                  }),
                  axiosConfig,
                ),
              );

              const updated = await this.flagSyncService.countUpdated(
                result.map(convertKeysToCamelCase),
              );

              await this.flagSyncService.save(
                result.map(
                  (flag) =>
                    new FlagEntity({
                      ...convertKeysToCamelCase(flag),
                      label: new FlagLabelEntity(flag),
                    }),
                ),
              );

              this.logger.log(`Found ${updated} updated flags`);

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
