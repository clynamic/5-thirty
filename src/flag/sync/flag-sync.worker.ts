import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostFlag, postFlags } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  convertKeysToCamelCase,
  DateRange,
  findContiguityGaps,
  findHighestId,
  findLowestDate,
  findLowestId,
  getIdRangeString,
  LoopGuard,
  PartialDateRange,
  rateLimit,
} from 'src/utils';

import { FlagCacheEntity, FlagEntity } from '../flag.entity';
import { FlagSyncService } from './flag-sync.service';

@Injectable()
export class FlagSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly flagSyncService: FlagSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(FlagSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Flag Orders Sync',
        key: `/${ItemType.flags}/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.flags,
            recentlyRange,
          );

          for (const order of orders) {
            const results: PostFlag[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              this.logger.log(
                `Fetching flags for ${dateRange.toE621RangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                postFlags(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': getIdRangeString(lowerId, upperId),
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.flagSyncService.create(
                result.map(
                  (flag) =>
                    new FlagEntity({
                      ...convertKeysToCamelCase(flag),
                      cache: new FlagCacheEntity(flag),
                    }),
                ),
              );

              this.logger.log(
                `Found ${result.length} flags with ids ${
                  getIdRangeString(
                    findLowestId(result)?.id,
                    findHighestId(result)?.id,
                  ) || 'none'
                } and dates ${
                  new PartialDateRange({
                    startDate: findLowestDate(stored)?.createdAt,
                    endDate: findHighestId(stored)?.createdAt,
                  }).toE621RangeString() || 'none'
                }`,
              );

              this.manifestService.saveResults({
                type: ItemType.flags,
                order,
                items: stored,
              });

              if (result.length === 0) {
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
        },
      }),
    );
  }
}
