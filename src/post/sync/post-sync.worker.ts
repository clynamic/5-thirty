import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { postsMany } from 'src/api';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { UserSyncService } from 'src/user/sync/user-sync.service';

import { PostEntity } from '../post.entity';
import { PostSyncService } from './post-sync.service';

@Injectable()
export class PostSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly postSyncService: PostSyncService,
    private readonly userSyncService: UserSyncService,
  ) {}

  private readonly logger = new Logger(PostSyncWorker.name);

  @Cron(CronExpression.EVERY_HOUR)
  async fetchAvatars() {
    this.jobService.add(
      new Job({
        title: 'Post Avatars Sync',
        key: `/${ItemType.posts}/avatars`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

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
