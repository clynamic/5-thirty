import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { Approval, postApprovals } from 'src/api/e621';
import { AxiosAuthService } from 'src/auth';
import { CacheEntity } from 'src/cache';
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

import { ApprovalEntity } from './approval.entity';
import { ApprovalService } from './approval.service';

@Injectable()
export class ApprovalWorker {
  constructor(
    private readonly axiosAuthService: AxiosAuthService,
    private readonly approvalService: ApprovalService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(ApprovalWorker.name);
  private isRunning = false;

  @Cron(CronExpression.EVERY_5_MINUTES)
  async onSync() {
    if (this.isRunning) {
      this.logger.warn('Task already running, skipping...');
      return;
    }

    this.logger.log('Running...');
    this.isRunning = true;

    try {
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
            const stored = await this.approvalService.create(
              result.map(
                (approval) =>
                  new ApprovalEntity({
                    ...convertKeysToCamelCase(approval),
                    cache: new CacheEntity({
                      id: `/${ManifestType.approvals}/${approval.id}`,
                      value: approval,
                    }),
                  }),
              ),
            );

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
                endDate: dayjs.min(dayjs(order.upper), currentDate).toDate(),
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
              order.lower.completedEnd = dayjs(order.lower.endDate).isBefore(
                currentDate,
              );
              this.manifestService.save(order.lower);
            } else {
              // abort without data
            }

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
    } catch (error) {
      this.logger.error(
        `An error occurred while running ${ApprovalWorker.name}`,
        error,
        error.stack,
      );
    } finally {
      this.logger.log('Finished');
      this.isRunning = false;
    }
  }
}
