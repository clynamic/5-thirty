import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostFlag, postFlags } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  convertKeysToCamelCase,
  findContiguityGaps,
  findHighestId,
  findLowestId,
  getIdRangeString,
  getRecentDateRange,
  LoopGuard,
  rateLimit,
} from 'src/utils';

import { FlagCacheEntity, FlagEntity } from '../flag.entity';
import { FlagSyncService } from './flag-sync.service';

@Injectable()
export class FlagSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly axiosAuthService: AxiosAuthService,
    private readonly flagSyncService: FlagSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(FlagSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Flag Orders Sync',
        key: `/${ManifestType.flags}/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const recentlyRange = getRecentDateRange();

          const orders = await this.manifestService.listOrdersByRange(
            ManifestType.flags,
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
                `Fetching flags for ${dateRange.toRangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                postFlags(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toRangeString(),
                    'search[id]': getIdRangeString(lowerId, upperId),
                  }),
                  axiosConfig,
                ),
              );

              this.logger.log(
                `Found ${result.length} flags with id range ${getIdRangeString(
                  findLowestId(result)?.id,
                  findHighestId(result)?.id,
                )}`,
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

              this.manifestService.saveResults({
                type: ManifestType.flags,
                order,
                items: stored,
              });

              if (result.length === 0) {
                const gaps = findContiguityGaps(results);
                if (gaps.size > 0) {
                  this.logger.warn(
                    `Found ${gaps.size} gaps in ID contiguity: ${JSON.stringify(gaps)},`,
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
