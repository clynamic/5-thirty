import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import _ from 'lodash';
import { posts } from 'src/api';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';
import { rateLimit } from 'src/utils';

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
    this.jobService.addJob(
      new Job({
        title: 'Post Avatars Sync',
        key: `/${ManifestType.posts}/avatars`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const avatars = await this.userSyncService.listNotableAvatars({
            newerThan: dayjs().subtract(1, 'month').toDate(),
          });

          this.logger.log(`Found ${avatars.length} avatar ids`);

          const notStoredIds =
            await this.postSyncService.findNotStored(avatars);

          const chunks = _.chunk(notStoredIds, 40);

          for (const chunk of chunks) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              posts(
                {
                  page: 1,
                  limit: 40,
                  tags: `id:${chunk.join(',')}`,
                },
                axiosConfig,
              ),
            );

            this.logger.log(`Found ${result.length} avatars`);

            await this.postSyncService.create(
              result.map((post) => PostEntity.fromPost(post)),
            );
          }
        },
      }),
    );
  }
}
