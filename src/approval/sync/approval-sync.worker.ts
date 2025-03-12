import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Approval, postApprovals } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { CacheManager } from 'src/app/browser.module';
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

import { ApprovalEntity, ApprovalLabelEntity } from '../approval.entity';
import { ApprovalSyncService } from './approval-sync.service';

@Injectable()
export class ApprovalSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly approvalSyncService: ApprovalSyncService,
    private readonly manifestService: ManifestService,
    private readonly cacheManager: CacheManager,
  ) {}

  private readonly logger = new Logger(ApprovalSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Approval Orders Sync',
        key: `/${ItemType.approvals}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.approvals,
            recentlyRange,
          );

          for (const order of orders) {
            const results: Approval[] = [];

            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.approvals, order);

              const result = await rateLimit(
                postApprovals(
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

              const stored = await this.approvalSyncService.save(
                result.map(
                  (approval) =>
                    new ApprovalEntity({
                      ...convertKeysToCamelCase(approval),
                      label: new ApprovalLabelEntity(approval),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.approvals, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.approvals,
                order,
                items: stored,
                exhausted,
              });

              if (results.length) {
                this.cacheManager.delDep(ApprovalEntity);
              }

              if (exhausted) {
                // Approvals cannot be deleted.If there are gaps, something went wrong.
                logContiguityGaps(this.logger, ItemType.approvals, results);
                break;
              }
            }
          }
        },
      }),
    );
  }
}
