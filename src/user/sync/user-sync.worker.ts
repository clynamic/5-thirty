import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import dayjs from 'dayjs';
import _ from 'lodash';
import { users } from 'src/api/e621';
import { UserLevel } from 'src/auth/auth.level';
import { AxiosAuthService } from 'src/auth/axios-auth.service';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ManifestType } from 'src/manifest/manifest.entity';
import { convertKeysToCamelCase, LoopGuard, rateLimit } from 'src/utils';

import { UserCacheEntity, UserEntity } from '../user.entity';
import { NotabilityType, NotableUserEntity } from './notable-user.entity';
import { UserSyncService } from './user-sync.service';

@Injectable()
export class UserSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly userSyncService: UserSyncService,
    private readonly axiosAuthService: AxiosAuthService,
  ) {}

  private readonly logger = new Logger(UserSyncWorker.name);

  @Cron(CronExpression.EVERY_HOUR)
  refreshStaff() {
    this.jobService.addJob(
      new Job({
        title: 'User Staff Sync',
        key: `/${ManifestType.users}/staff`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const loopGuard = new LoopGuard();
          let page = 1;
          const limit = 100;

          while (true) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              users(
                loopGuard.iter({
                  page,
                  limit,
                  'search[min_level]': UserLevel.Janitor,
                }),
                axiosConfig,
              ),
            );

            this.logger.log(`Found ${result.length} staff members`);

            await this.userSyncService.create(
              result.map(
                (user) =>
                  new UserEntity({
                    ...convertKeysToCamelCase(user),
                    cache: new UserCacheEntity(user),
                  }),
              ),
            );

            await this.userSyncService.note(
              result.map(
                (user) =>
                  new NotableUserEntity({
                    id: user.id,
                    type: NotabilityType.staff,
                  }),
              ),
            );

            if (result.length < limit) break;
            page++;
          }
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  refreshNotable() {
    this.jobService.addJob(
      new Job({
        title: 'User Notable Sync',
        key: `/${ManifestType.users}/notable`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const notable = await this.userSyncService.listNotable({
            // staff are already handled by the staff sync
            type: Object.values(NotabilityType).filter(
              (type) => type !== NotabilityType.staff,
            ),
            newerThan: dayjs().subtract(1, 'month').toDate(),
          });

          const chunks = _.chunk(
            notable.map((notable) => notable.id),
            100,
          );

          for (const chunk of chunks) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              users(
                {
                  page: 1,
                  limit: 100,
                  'search[id]': chunk.join(','),
                },
                axiosConfig,
              ),
            );

            this.logger.log(`Found ${result.length} notable users`);

            await this.userSyncService.create(
              result.map(
                (user) =>
                  new UserEntity({
                    ...convertKeysToCamelCase(user),
                    cache: new UserCacheEntity(user),
                  }),
              ),
            );
          }
        },
      }),
    );
  }
}
