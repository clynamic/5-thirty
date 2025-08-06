import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  GetUserFeedbacksSearchDeleted,
  UserFeedback,
  userFeedbacks,
} from 'src/api/e621';
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

import { FeedbackEntity, FeedbackLabelEntity } from '../feedback.entity';
import { FeedbackSyncService } from './feedback-sync.service';

@Injectable()
export class FeedbackSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly feedbackSyncService: FeedbackSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(FeedbackSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runFeedbacks() {
    this.jobService.add(
      new Job({
        title: 'User Feedbacks Sync',
        key: `/${ItemType.feedbacks}/sync`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.feedbacks,
            recentlyRange,
          );

          for (const order of orders) {
            const results: UserFeedback[] = [];

            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.feedbacks, order);

              const result = await rateLimit(
                userFeedbacks(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[deleted]': GetUserFeedbacksSearchDeleted.included,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.feedbackSyncService.save(
                result.map(
                  (feedback) =>
                    new FeedbackEntity({
                      ...convertKeysToCamelCase(feedback),
                      label: new FeedbackLabelEntity(feedback),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.feedbacks, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.feedbacks,
                order: order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                logContiguityGaps(this.logger, ItemType.feedbacks, results);
                break;
              }
            }
          }
        },
      }),
    );
  }
}
