import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sub } from 'date-fns';
import { usersMany } from 'src/api';
import { users } from 'src/api/e621';
import { UserLevel } from 'src/auth/auth.level';
import { AuthService } from 'src/auth/auth.service';
import { convertKeysToCamelCase, LoopGuard, rateLimit } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';

import { NotabilityType, NotableUserEntity } from '../notable-user.entity';
import { UserEntity, UserLabelEntity } from '../user.entity';
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
                  'search[min_level]': UserLevel.FormerStaff,
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
                    label: new UserLabelEntity(user),
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  refreshNotable() {
    this.jobService.add(
      new Job({
        title: 'User Notable Sync',
        key: `/${ItemType.users}/notable`,
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const notable = await this.userSyncService.listNotable({
            // staff are already handled by the staff sync
            type: Object.values(NotabilityType).filter(
              (type) => type !== NotabilityType.staff,
            ),
            newerThan: sub(new Date(), { months: 1 }),
          });

          const users = await this.userSyncService.findOutdated(
            notable.map((notable) => notable.id),
          );

          await usersMany(
            users,
            this.authService.getServerAxiosConfig(),
            async (result) => {
              this.logger.log(`Found ${result.length} notable users`);

              await this.userSyncService.create(
                result.map(
                  (user) =>
                    new UserEntity({
                      ...convertKeysToCamelCase(user),
                      label: new UserLabelEntity(user),
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
