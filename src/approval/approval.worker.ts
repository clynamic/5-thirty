import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApprovalService } from './approval.service';
import { ManifestEntity, ManifestService } from 'src/manifest';
import {
  convertKeysToCamelCase,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  getCurrentMonthRange,
  getDateRangeString,
  getRangeString,
  rateLimit,
} from 'src/utils';
import { postApprovals } from 'src/api/e621';
import { ConfigService } from '@nestjs/config';
import { AppConfigKeys } from 'src/app/config.module';
import { encodeCredentials } from 'src/auth/auth.utils';
import { UserCredentials } from 'src/auth';
import { ApprovalEntity } from './approval.entity';
import { CacheEntity } from 'src/cache';

@Injectable()
export class ApprovalWorker {
  constructor(
    private readonly configService: ConfigService,
    private readonly approvalService: ApprovalService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(ApprovalWorker.name);
  private isRunning = false;

  private manifestType = 'approvals';

  @Cron(CronExpression.EVERY_5_MINUTES)
  async onSync() {
    if (this.isRunning) {
      this.logger.warn('Task already running, skipping...');
      return;
    }

    if (1 === 1) {
      return;
    }

    this.logger.log('ApprovalWorker is running');
    this.isRunning = true;

    try {
      const credentials: UserCredentials = {
        username: this.configService.get<string>(
          AppConfigKeys.E621_GLOBAL_USERNAME,
        ),
        password: this.configService.get<string>(
          AppConfigKeys.E621_GLOBAL_API_KEY,
        ),
      };

      const currentMonthRange = getCurrentMonthRange();

      const manifests = await this.manifestService.listByRange(
        this.manifestType,
        currentMonthRange,
      );

      this.logger.log(
        `Found ${manifests.length} manifests: ${JSON.stringify(manifests)}`,
      );

      const orders = await this.manifestService.listOrdersByRange(
        this.manifestType,
        currentMonthRange,
      );

      this.logger.log(
        `Found ${orders.length} orders: ${JSON.stringify(orders)}`,
      );

      for (const order of orders) {
        const limit = 320;

        let upperId: number | undefined;
        let lowerId: number | undefined;

        while (true) {
          const dateRange = {
            start: ManifestService.getBoundaryDate(order.lower, 'end'),
            end: ManifestService.getBoundaryDate(order.upper, 'start'),
          };

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
            `Fetching approvals for ${getDateRangeString(dateRange)} with ids ${getRangeString(
              lowerId,
              upperId,
            )}`,
          );

          const result = await rateLimit(
            postApprovals(
              {
                page: 1,
                limit,
                'search[created_at]': getDateRangeString(dateRange),
                'search[id]': getRangeString(lowerId, upperId),
              },
              {
                headers: {
                  Authorization: encodeCredentials(credentials),
                },
              },
            ),
          );

          if (result.length > 0) {
            this.logger.log(
              `Found ${result.length} approvals with id range ${getRangeString(
                findLowestId(result).id,
                findHighestId(result).id,
              )}`,
            );

            const stored = await this.approvalService.create(
              result.map(
                (approval) =>
                  new ApprovalEntity({
                    ...convertKeysToCamelCase(approval),
                    cache: new CacheEntity({
                      value: approval,
                    }),
                  }),
              ),
            );

            if (order.upper instanceof ManifestEntity) {
              order.upper.lowerId = findLowestId(stored).id;
              order.upper.startDate = findLowestDate(stored).createdAt;
            } else {
              order.upper = new ManifestEntity({
                type: this.manifestType,
                lowerId: findLowestId(stored).id,
                upperId: findHighestId(stored).id,
                startDate: findLowestDate(stored).createdAt,
                endDate: findHighestDate(stored).createdAt,
                completedEnd: true,
              });
            }

            this.manifestService.save(order.upper);
          } else {
            this.logger.log('No approvals found');

            if (order.upper instanceof ManifestEntity) {
              if (order.lower instanceof ManifestEntity) {
                // merge
                this.logger.log('Merging manifests');
                order.upper.lowerId = order.lower.lowerId;
                order.upper.startDate = order.lower.startDate;
                order.lower.completedEnd = true;
                this.manifestService.save(order.lower);
              } else {
                // extend upper downwards
                this.logger.log('Extending upper downwards');
                order.upper.startDate = order.lower;
                order.upper.completedStart = true;
                this.manifestService.save(order.upper);
              }
            } else if (order.lower instanceof ManifestEntity) {
              // extend lower upwards
              this.logger.log('Extending lower upwards');
              order.lower.endDate = order.upper;
              order.lower.completedEnd = true;
              this.manifestService.save(order.lower);
            } else {
              // abort
              // with no data, we can't create a manifest.
              this.logger.log('No data to create manifest, aborting');
            }

            break;
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `An error occurred while running ${ApprovalWorker.name}`,
        error,
      );
    } finally {
      this.isRunning = false;
    }
  }
}
