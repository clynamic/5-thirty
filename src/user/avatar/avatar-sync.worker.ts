import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sub } from 'date-fns';
import { postsMany } from 'src/api';
import { AuthService } from 'src/auth/auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { PostEntity } from 'src/post/post.entity';
import { UserSyncService } from 'src/user/sync/user-sync.service';

import { AvatarSyncService } from './avatar-sync.service';

@Injectable()
export class AvatarSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly avatarSyncService: AvatarSyncService,
    private readonly userSyncService: UserSyncService,
  ) {}

  private readonly logger = new Logger(AvatarSyncWorker.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async fetchAvatars() {
    this.jobService.add(
      new Job({
        title: 'User Avatars Sync',
        key: `/avatars`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const avatars = await this.userSyncService.listNotableAvatars({
            newerThan: sub(new Date(), { months: 1 }),
          });

          this.logger.log(`Found ${avatars.length} avatar ids`);

          const notStoredIds =
            await this.avatarSyncService.findNotStored(avatars);

          postsMany(notStoredIds, axiosConfig, async (result) => {
            await this.avatarSyncService.create(
              result.map((post) => PostEntity.fromPost(post)),
            );

            cancelToken.ensureRunning();
          });
        },
      }),
    );
  }
}
