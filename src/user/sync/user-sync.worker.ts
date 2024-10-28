import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { usersMany } from 'src/api';
import { users } from 'src/api/e621';
import { UserLevel } from 'src/auth/auth.level';
import { AuthService } from 'src/auth/auth.service';
import { ItemType } from 'src/cache/cache.entity';
import { convertKeysToCamelCase, LoopGuard, rateLimit } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';

import { UserCacheEntity, UserEntity } from '../user.entity';
import { NotabilityType, NotableUserEntity } from './notable-user.entity';
import { UserSyncService } from './user-sync.service';

@Injectable()
export class UserSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly userSyncService: UserSyncService,
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger(UserSyncWorker.name);

  @Cron(CronExpression.EVERY_HOUR)
  refreshStaff() {
    this.jobService.add(
      new Job({
        title: 'User Staff Sync',
        key: `/${ItemType.users}/staff`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

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
    this.jobService.add(
      new Job({
        title: 'User Notable Sync',
        key: `/${ItemType.users}/notable`,
        execute: async ({ cancelToken }) => {
          const notable = await this.userSyncService.listNotable({
            // staff are already handled by the staff sync
            type: Object.values(NotabilityType).filter(
              (type) => type !== NotabilityType.staff,
            ),
            newerThan: DateTime.now().minus({ months: 1 }).toJSDate(),
          });

          await usersMany(
            notable.map((notable) => notable.id),
            this.authService.getServerAxiosConfig(),
            async (result) => {
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

              cancelToken.ensureRunning();
            },
          );
        },
      }),
    );
  }
}
