import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  GetPostVersionsSearchUploads,
  PostVersion,
  postVersions,
} from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
import {
  convertKeysToCamelCase,
  DateRange,
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
import {
  PostVersionCacheEntity,
  PostVersionEntity,
} from 'src/post_version/post_version.entity';

import { UploadSyncService } from './upload-sync.service';

@Injectable()
export class UploadSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly uploadSyncService: UploadSyncService,
    private readonly manifestService: ManifestService,
  ) {}

  private readonly logger = new Logger(UploadSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  runOrders() {
    this.jobService.add(
      new Job({
        title: 'Post Uploads Sync',
        key: `/uploads/orders`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const recentlyRange = DateRange.recentMonths();

          const orders = await this.manifestService.listOrdersByRange(
            ItemType.postVersions,
            recentlyRange,
          );

          for (const order of orders) {
            const results: PostVersion[] = [];
            const loopGuard = new LoopGuard();

            while (true) {
              cancelToken.ensureRunning();

              const dateRange = order.toDateRange();
              const lowerId = order.lowerId;
              const upperId = order.upperId;

              this.logger.log(
                `Fetching post uploads for ${dateRange.toE621RangeString()} with ids ${getIdRangeString(
                  lowerId,
                  upperId,
                )}`,
              );

              const result = await rateLimit(
                postVersions(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[updated_at]': dateRange.toE621RangeString(),
                    'search[id]': getIdRangeString(lowerId, upperId),
                    'search[uploads]': GetPostVersionsSearchUploads.only,
                    'search[order]': 'id',
                  }),
                  axiosConfig,
                ),
              );

              results.push(...result);

              const stored = await this.uploadSyncService.save(
                result.map(
                  (postVersion) =>
                    new PostVersionEntity({
                      ...convertKeysToCamelCase(postVersion),
                      cache: new PostVersionCacheEntity(postVersion),
                    }),
                ),
              );

              this.logger.log(
                `Found ${result.length} post versions with ids ${
                  getIdRangeString(
                    findLowestId(result)?.id,
                    findHighestId(result)?.id,
                  ) || 'none'
                } and dates ${
                  new PartialDateRange({
                    startDate: findLowestDate(stored)?.updatedAt,
                    endDate: findHighestDate(stored)?.updatedAt,
                  }).toE621RangeString() || 'none'
                }`,
              );

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.postVersions,
                order,
                items: stored,
                exhausted,
              });

              if (exhausted) {
                break;
              }
            }
          }

          await this.manifestService.mergeInRange(
            ItemType.postVersions,
            recentlyRange,
          );
        },
      }),
    );
  }
}
