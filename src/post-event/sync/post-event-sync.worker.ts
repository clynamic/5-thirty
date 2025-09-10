import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostEvent, postEvents } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import {
  DateRange,
  LoopGuard,
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

import { PostEventEntity, PostEventLabelEntity } from '../post-event.entity';
import { PostEventSyncService } from './post-event-sync.service';

@Injectable()
export class PostEventSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly postEventSyncService: PostEventSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(PostEventSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Post Event Orders Sync',
        key: `/${ItemType.postEvents}/orders`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.postEvents,
            recentlyRange,
          );

          for (let order of orders) {
            const results: PostEvent[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order.ranges;

              logOrderFetch(this.logger, ItemType.postEvents, order);

              const result = await rateLimit(
                postEvents(
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

              const stored = await this.postEventSyncService.save(
                result.map(
                  (postEvent) =>
                    new PostEventEntity({
                      ...convertKeysToCamelCase(postEvent),
                      label: new PostEventLabelEntity(postEvent),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.postEvents, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              order = await this.manifestService.saveResults({
                type: ItemType.postEvents,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                logContiguityGaps(this.logger, ItemType.postEvents, results);
                break;
              }
            }
          }

          await this.manifestService.mergeInRange(
            ItemType.postEvents,
            recentlyRange,
          );
        },
      }),
    );
  }
}
