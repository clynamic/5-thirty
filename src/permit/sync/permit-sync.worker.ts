import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { posts } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { CacheManager } from 'src/app/browser.module';
import { AuthService } from 'src/auth/auth.service';
import {
  DateRange,
  LoopGuard,
  logOrderFetch,
  logOrderResult,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';

import { PermitEntity, PermitLabelEntity } from '../permit.entity';
import { PermitSyncService } from './permit-sync.service';

@Injectable()
export class PermitSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly permitSyncService: PermitSyncService,
    private readonly manifestService: ManifestService,
    private readonly cacheManager: CacheManager,
  ) {}

  private readonly logger = new Logger(PermitSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Permit Orders Sync',
        key: `/${ItemType.permits}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.permits,
            recentlyRange,
          );

          for (let order of orders) {
            const results: PermitEntity[] = [];
            const loopGuard = new LoopGuard();
            const inPast = order.inPast;

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.permits, order);

              const tagsQuery = [
                'approver:none',
                '-status:pending',
                `date:${dateRange.toE621RangeString()}`,
                !idRange.isEmpty ? `id:${idRange.toE621RangeString()}` : '',
              ]
                .filter(Boolean)
                .join(' ');

              const result = await rateLimit(
                posts(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    tags: tagsQuery,
                  }),
                  axiosConfig,
                ),
              );

              const permits = result.map(
                (post) =>
                  new PermitEntity({
                    id: post.id,
                    uploaderId: post.uploader_id,
                    createdAt: new Date(post.created_at),
                    label: new PermitLabelEntity(post.id),
                  }),
              );

              results.push(...permits);

              const stored = await this.permitSyncService.save(permits);

              logOrderResult(this.logger, ItemType.permits, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              order = await this.manifestService.saveResults({
                type: ItemType.permits,
                order,
                items: stored,
                bottom: exhausted,
                top: inPast,
              });

              if (permits.length) {
                this.cacheManager.inv(PermitEntity);
              }

              if (exhausted) {
                // This sync is porous and always has gaps.
                // logContiguityGaps(this.logger, ItemType.permits, results);
                break;
              }
            }
          }
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runCleanup() {
    this.jobService.add(
      new Job({
        title: 'Permit Cleanup',
        key: `/${ItemType.permits}/cleanup`,
        execute: async () => {
          const invalidPermits =
            await this.permitSyncService.findInvalidPermits();

          if (invalidPermits.length > 0) {
            await this.permitSyncService.remove(invalidPermits);
            this.logger.log(
              `Cleaned up ${invalidPermits.length} invalid permits`,
            );
            this.cacheManager.inv(PermitEntity);
          }
        },
      }),
    );
  }
}
