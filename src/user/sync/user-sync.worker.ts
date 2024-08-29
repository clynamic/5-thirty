import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import _ from 'lodash';
import { users } from 'src/api/e621';
import { AxiosAuthService, UserLevel } from 'src/auth';
import { Job, JobService } from 'src/job';
import { ManifestType } from 'src/manifest';
import { TicketMetricService } from 'src/ticket';
import {
  convertKeysToCamelCase,
  LoopGuard,
  rateLimit,
  SummaryQuery,
} from 'src/utils';

import { UserCacheEntity, UserEntity } from '../user.entity';
import { UserSyncService } from './user-sync.service';

@Injectable()
export class UserSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly userSyncService: UserSyncService,
    private readonly axiosAuthService: AxiosAuthService,
    private readonly ticketMetricService: TicketMetricService,
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

          while (true) {
            cancelToken.ensureRunning();

            const result = await rateLimit(
              users(
                loopGuard.iter({
                  page,
                  limit: 100,
                  'search[min_level]': UserLevel.Janitor,
                }),
                axiosConfig,
              ),
            );

            if (result.length === 0) break;

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

            page++;
          }
        },
      }),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  refreshReporters() {
    this.jobService.addJob(
      new Job({
        title: 'User Reporter Sync',
        key: `/${ManifestType.users}/reporters`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.axiosAuthService.getGlobalConfig();

          const reporters = await this.ticketMetricService.reporterSummary(
            new SummaryQuery({
              limit: 100,
            }),
          );

          const loopGuard = new LoopGuard();
          const chunks = _.chunk(
            reporters.map((reporter) => reporter.userId),
            100,
          );
          let page = 0;

          while (true) {
            cancelToken.ensureRunning();

            if (page >= chunks.length) break;

            const result = await rateLimit(
              users(
                loopGuard.iter({
                  page: 1,
                  limit: 100,
                  'search[id]': chunks[page]!.join(','),
                }),
                axiosConfig,
              ),
            );

            this.logger.log(`Found ${result.length} reporters`);

            await this.userSyncService.create(
              result.map(
                (user) =>
                  new UserEntity({
                    ...convertKeysToCamelCase(user),
                    cache: new UserCacheEntity(user),
                  }),
              ),
            );

            page++;
          }
        },
      }),
    );
  }
}
