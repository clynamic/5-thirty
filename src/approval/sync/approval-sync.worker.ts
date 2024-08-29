import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { Approval, postApprovals } from 'src/api/e621';
import { AxiosAuthService } from 'src/auth';
import { Job, JobService } from 'src/job';
import { ManifestEntity, ManifestService, ManifestType } from 'src/manifest';
import {
  convertKeysToCamelCase,
  DateRange,
  findContiguityGaps,
  findHighestId,
  findLowestDate,
  findLowestId,
  getIdRangeString,
  getTwoMonthsRange,
  LoopGuard,
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
    this.jobService.addJob(
      new Job({
        title: 'Approval Orders Sync',
        key: `/${ManifestType.approvals}/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const recentlyRange = getTwoMonthsRange();
          const currentDate = dayjs().utc().startOf('day');

          const orders = await this.manifestService.listOrdersByRange(
            ManifestType.approvals,
            recentlyRange,
          );

          for (const order of orders) {
            const limit = 320;
            let results: Approval[] = [];

            let upperId: number | undefined;
            let lowerId: number | undefined;

            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = new DateRange({
                startDate: ManifestService.getBoundaryDate(order.lower, 'end'),
                endDate: ManifestService.getBoundaryDate(order.upper, 'start'),
              });

              if (order.lower instanceof ManifestEntity) {
                lowerId = order.lower.upperId;
              } else {
                lowerId = undefined;
              }

              if (order.upper instanceof ManifestEntity) {
                upperId = order.upper.lowerId;
              } else {
                upperId = undefined;
              }

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
                    limit,
                    'search[created_at]': dateRange.toRangeString(),
                    // because post_approvals are ordered properly id descending,
                    // we can rely on always getting (almost) contiguous results
                    // some approval IDs seem to just not exist, but that's fine for this use case
                    'search[id]': getIdRangeString(lowerId, upperId),
                  }),
                  axiosConfig,
                ),
              );

              this.logger.log(
                `Found ${result.length} approvals with id range ${getIdRangeString(
                  findLowestId(result)?.id,
                  findHighestId(result)?.id,
                )}`,
              );

              results = results.concat(result);

              if (result.length > 0) {
                const stored = await this.approvalSyncService.create(
                  result.map(
                    (approval) =>
                      new ApprovalEntity({
                        ...convertKeysToCamelCase(approval),
                        cache: new ApprovalCacheEntity(approval),
                      }),
                  ),
                );

                // TODO: make this code reusable
                if (order.upper instanceof ManifestEntity) {
                  // extend upper downwards
                  order.upper.lowerId =
                    findLowestId(stored)?.id ?? order.upper.lowerId;
                  order.upper.startDate =
                    findLowestDate(stored)?.createdAt ?? order.upper.startDate;

                  this.manifestService.save(order.upper);
                } else {
                  // create new manifest
                  order.upper = new ManifestEntity({
                    type: ManifestType.approvals,
                    lowerId: findLowestId(stored)!.id,
                    upperId: findHighestId(stored)!.id,
                    startDate: findLowestDate(stored)!.createdAt,
                    endDate: dayjs
                      .min(dayjs(order.upper), currentDate)
                      .toDate(),
                    completedEnd: dayjs(order.upper).isBefore(currentDate),
                  });

                  this.manifestService.save(order.upper);
                }
              } else {
                if (order.upper instanceof ManifestEntity) {
                  if (order.lower instanceof ManifestEntity) {
                    // merge manifests
                    order.upper.lowerId = order.lower.lowerId;
                    order.upper.startDate = order.lower.startDate;
                    order.upper.completedStart = order.lower.completedStart;

                    this.manifestService.save(order.upper);
                    this.manifestService.delete(order.lower);
                  } else {
                    // extend upper downwards
                    order.upper.lowerId =
                      findLowestId(result)?.id ?? order.upper.lowerId;
                    order.upper.startDate = order.lower;
                    order.upper.completedStart = true;

                    this.manifestService.save(order.upper);
                  }
                } else if (order.lower instanceof ManifestEntity) {
                  // extend lower upwards
                  order.lower.endDate = dayjs
                    .min(dayjs(order.upper), currentDate)
                    .toDate();
                  order.lower.completedEnd = dayjs(
                    order.lower.endDate,
                  ).isBefore(currentDate);
                  this.manifestService.save(order.lower);
                } else {
                  // abort without data
                }

                const gaps = findContiguityGaps(results);
                // as long as the gaps are not too big, one or two IDs, we can ignore them
                // these can be accounted for by the deleted (?) approvals
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
