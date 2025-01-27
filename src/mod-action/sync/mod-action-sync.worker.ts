import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModAction, modActions } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
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
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import { ModActionEntity, ModActionLabelEntity } from '../mod-action.entity';
import { ModActionSyncService } from './mod-action-sync.service';

@Injectable()
export class ModActionSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly modActionSyncService: ModActionSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(ModActionSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  runOrders() {
    this.jobService.add(
      new Job({
        title: 'Mod Action Orders Sync',
        key: `/${ItemType.modActions}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.modActions,
            recentlyRange,
          );

          for (const order of orders) {
            const results: ModAction[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              const rangeString = dateRange.toE621RangeString();
              const idString = getIdRangeString(lowerId, upperId);

              this.logger.log(
                `Fetching mod actions for ${rangeString} with ids ${idString}`,
              );

              const result = await rateLimit(
                modActions(
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

              const stored = await this.modActionSyncService.save(
                result.map(
                  (action) =>
                    new ModActionEntity({
                      ...convertKeysToCamelCase(action),
                      label: new ModActionLabelEntity(action),
                    }),
                ),
              );

              this.logger.log(
                `Found ${result.length} mod actions with ids ${
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
                type: ItemType.modActions,
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
            ItemType.modActions,
            recentlyRange,
          );
        },
      }),
    );
  }
}
