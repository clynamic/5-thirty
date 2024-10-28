import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  GetUserFeedbacksSearchDeleted,
  UserFeedback,
  userFeedbacks,
} from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
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
import { ManifestService } from 'src/manifest/manifest.service';

import { FeedbackCacheEntity, FeedbackEntity } from '../feedback.entity';
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
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const feedbacks = await this.manifestService.listOrdersByRange(
            ItemType.feedbacks,
            recentlyRange,
          );

          for (const feedback of feedbacks) {
            const results: UserFeedback[] = [];

            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = feedback.toDateRange();
              const lowerId = feedback.lowerId;
              const upperId = feedback.upperId;

              this.logger.log(
                `Fetching user feedbacks for ${dateRange.toE621RangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                userFeedbacks(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[deleted]': GetUserFeedbacksSearchDeleted.included,
                    'search[created_at]': dateRange.toE621RangeString(),
                    'search[id]': getIdRangeString(lowerId, upperId),
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
                      cache: new FeedbackCacheEntity(feedback),
                    }),
                ),
              );

              this.logger.log(
                `Found ${stored.length} feedbacks with ids ${
                  getIdRangeString(
                    findLowestId(stored)?.id,
                    findHighestId(stored)?.id,
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
                type: ItemType.feedbacks,
                order: feedback,
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
        },
      }),
    );
  }
}
