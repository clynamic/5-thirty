import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  GetPostVersionsSearchUploads,
  PostVersion,
  postVersions,
} from 'src/api/e621';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { CacheManager } from 'src/app/browser.module';
import { AuthService } from 'src/auth/auth.service';
import {
  convertKeysToCamelCase,
  DateRange,
  logOrderFetch,
  logOrderResult,
  LoopGuard,
  rateLimit,
} from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestService } from 'src/manifest/manifest.service';
import {
  PostVersionEntity,
  PostVersionLabelEntity,
} from 'src/post-version/post-version.entity';
import {
  NotabilityType,
  NotableUserEntity,
} from 'src/user/notable-user.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';

import { UploadSyncService } from './upload-sync.service';

@Injectable()
export class UploadSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly uploadSyncService: UploadSyncService,
    private readonly manifestService: ManifestService,
    private readonly userSyncService: UserSyncService,
    private readonly cacheManager: CacheManager,
  ) {}

  private readonly logger = new Logger(UploadSyncWorker.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  runOrders() {
    this.jobService.add(
      new Job({
        title: 'Post Uploads Order Sync',
        key: `/uploads/orders`,
        timeout: 1000 * 60 * 5,
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

              const { idRange, dateRange } = order;

              logOrderFetch(this.logger, ItemType.postVersions, order);

              const result = await rateLimit(
                postVersions(
                  loopGuard.iter({
                    page: 1,
                    limit: MAX_API_LIMIT,
                    'search[uploads]': GetPostVersionsSearchUploads.only,
                    'search[updated_at]': dateRange.toE621RangeString(),
                    'search[id]': idRange.toE621RangeString(),
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
                      label: new PostVersionLabelEntity(postVersion),
                    }),
                ),
              );

              logOrderResult(this.logger, ItemType.postVersions, stored);

              const exhausted = result.length < MAX_API_LIMIT;

              await this.manifestService.saveResults({
                type: ItemType.postVersions,
                order,
                items: stored,
                exhausted,
              });

              if (result.length) {
                this.cacheManager.inv(PostVersionEntity);
              }

              if (exhausted) {
                // upload-only post versions will never be contiguous, so we can skip that check
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  writeNotable() {
    this.jobService.add(
      new Job({
        title: 'Post Uploads Notable Sync',
        key: `/uploads/notable`,
        execute: async () => {
          const reporters = await this.uploadSyncService.findUploaders();

          await this.userSyncService.note(
            reporters.map(
              (reporter) =>
                new NotableUserEntity({
                  id: reporter,
                  type: NotabilityType.uploader,
                }),
            ),
          );

          this.logger.log(`Noted ${reporters.length} uploaders`);
        },
      }),
    );
  }
}
