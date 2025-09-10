import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BulkUpdateRequest,
  GetBulkUpdateRequestsSearchOrder,
  bulkUpdateRequests,
} from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
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
import { ItemType, getItemName } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import {
  BulkUpdateRequestEntity,
  BulkUpdateRequestLabelEntity,
} from '../bulk-update-request.entity';
import { BulkUpdateRequestSyncService } from './bulk-update-request-sync.service';

@Injectable()
export class BulkUpdateRequestSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly bulkUpdateRequestSyncService: BulkUpdateRequestSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(BulkUpdateRequestSyncWorker.name);
  private readonly type = ItemType.bulkUpdateRequests;

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: `${getItemName(this.type)} Orders Sync`,
        key: `/${this.type}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            this.type,
            recentlyRange,
          );

          for (let order of orders) {
            const results: BulkUpdateRequest[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order.ranges;

              logOrderFetch(this.logger, this.type, order);

              const result = await rateLimit(
                bulkUpdateRequests(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                    'search[order]': GetBulkUpdateRequestsSearchOrder.id_desc,
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.bulkUpdateRequestSyncService.save(
                result.map(
                  (request) =>
                    new BulkUpdateRequestEntity({
                      ...convertKeysToCamelCase(request),
                      label: new BulkUpdateRequestLabelEntity(request),
                    }),
                ),
              );

              logOrderResult(this.logger, this.type, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              order = await this.manifestService.saveResults({
                type: this.type,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                logContiguityGaps(this.logger, this.type, results);
                break;
              }
            }
          }

          await this.manifestService.mergeInRange(this.type, recentlyRange);
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runRefresh() {
    this.jobService.add(
      new Job({
        title: `${getItemName(this.type)} Refresh Sync`,
        key: `/${this.type}/refresh`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const manifests = await this.manifestService.list(undefined, {
            type: [this.type],
          });

          for (const manifest of manifests) {
            let refreshDate = manifest.refreshedAt;

            if (!refreshDate) {
              refreshDate = (
                await this.bulkUpdateRequestSyncService.firstFromId(
                  manifest.lowerId,
                )
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
                `Fetching bulk update requests for refresh date ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                bulkUpdateRequests(
                  loopGuard.iter({
                    page,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': rangeString,
                    'search[id]': idString,
                    'search[order]': GetBulkUpdateRequestsSearchOrder.id_desc,
                  }),
                  axiosConfig,
                ),
              );

              const updated =
                await this.bulkUpdateRequestSyncService.countUpdated(
                  result.map(convertKeysToCamelCase),
                );

              await this.bulkUpdateRequestSyncService.save(
                result.map(
                  (request) =>
                    new BulkUpdateRequestEntity({
                      ...convertKeysToCamelCase(request),
                      label: new BulkUpdateRequestLabelEntity(request),
                    }),
                ),
              );

              this.logger.log(`Found ${updated} updated bulk update requests`);

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
