import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { postsMany } from 'src/api';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';

import { PostEntity } from '../post.entity';
import { PostSyncService } from './post-sync.service';

@Injectable()
export class PostSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly axiosAuthService: AxiosAuthService,
    private readonly postSyncService: PostSyncService,
    private readonly userSyncService: UserSyncService,
  ) {}

  private readonly logger = new Logger(PostSyncWorker.name);

  @Cron(CronExpression.EVERY_HOUR)
  async fetchAvatars() {
    this.jobService.add(
      new Job({
        title: 'Post Avatars Sync',
        key: `/${ManifestType.posts}/avatars`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const avatars = await this.userSyncService.listNotableAvatars({
            newerThan: DateTime.now().minus({ months: 1 }).toJSDate(),
          });

          this.logger.log(`Found ${avatars.length} avatar ids`);

          const notStoredIds =
            await this.postSyncService.findNotStored(avatars);

          postsMany(notStoredIds, axiosConfig, async (result) => {
            await this.postSyncService.create(
              result.map((post) => PostEntity.fromPost(post)),
            );

            cancelToken.ensureRunning();
          });
        },
      }),
    );
  }
}
