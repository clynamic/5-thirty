import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModAction, modActions } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  convertKeysToCamelCase,
  DateRange,
  logContiguityGaps,
  logOrderFetch,
  logOrderResult,
  LoopGuard,
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

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.modActions, order);

              const result = await rateLimit(
                modActions(
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

              const stored = await this.modActionSyncService.save(
                result.map(
                  (action) =>
                    new ModActionEntity({
                      ...convertKeysToCamelCase(action),
                      label: new ModActionLabelEntity(action),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.modActions, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.modActions,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                // Despite not finding any indication of this in the source code,
                // _some_ mod actions are deleted. It is unclear why. Gaps might not indicate an error.
                logContiguityGaps(this.logger, ItemType.modActions, results);
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
