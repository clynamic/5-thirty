import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Approval, postApprovals } from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  convertKeysToCamelCase,
  findContiguityGaps,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  getDateRangeString,
  getIdRangeString,
  getRecentDateRange,
  LoopGuard,
  PartialDateRange,
  rateLimit,
} from 'src/utils';

import { ApprovalCacheEntity, ApprovalEntity } from '../approval.entity';
import { ApprovalSyncService } from './approval-sync.service';

@Injectable()
export class ApprovalSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly axiosAuthService: AxiosAuthService,
    private readonly approvalSyncService: ApprovalSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(ApprovalSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runOrders() {
    this.jobService.add(
      new Job({
        title: 'Approval Orders Sync',
        key: `/${ManifestType.approvals}/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const recentlyRange = getRecentDateRange();

          const orders = await this.manifestService.listOrdersByRange(
            ManifestType.approvals,
            recentlyRange,
          );

          for (const order of orders) {
            const results: Approval[] = [];

            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              this.logger.log(
                `Fetching approvals for ${dateRange.toRangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                postApprovals(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[created_at]': dateRange.toRangeString(),
                    // because post_approvals are ordered properly id descending,
                    // we can rely on always getting (almost) contiguous results
                    // some approval IDs seem to just not exist, but that's fine for this use case
                    'search[id]': getIdRangeString(lowerId, upperId),
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.approvalSyncService.create(
                result.map(
                  (approval) =>
                    new ApprovalEntity({
                      ...convertKeysToCamelCase(approval),
                      cache: new ApprovalCacheEntity(approval),
                    }),
                ),
              );

              this.logger.log(
                `Found ${stored.length} approvals with ids ${
                  getIdRangeString(
                    findLowestId(stored)?.id,
                    findHighestId(stored)?.id,
                  ) || 'none'
                } and dates ${
                  getDateRangeString(
                    new PartialDateRange({
                      startDate: findLowestDate(stored)?.createdAt,
                      endDate: findHighestDate(stored)?.createdAt,
                    }),
                  ) || 'none'
                }`,
              );

              await this.manifestService.saveResults({
                type: ManifestType.approvals,
                order,
                items: stored,
              });

              if (result.length === 0) {
                const gaps = findContiguityGaps(results);
                // as long as the gaps are not too big, one or two IDs, we can ignore them
                // these can be accounted for by the deleted (?) approvals
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
