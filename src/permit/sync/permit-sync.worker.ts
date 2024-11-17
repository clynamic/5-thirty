import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { chunk } from 'lodash';
import { Post, posts } from 'src/api';
import { MAX_API_LIMIT } from 'src/api/http/params';
import { CacheManager } from 'src/app/browser.module';
import { AuthService } from 'src/auth/auth.service';
import { LoopGuard, rateLimit } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { PostEntity } from 'src/post/post.entity';

import { PermitEntity } from '../permit.entity';
import { PermitSyncService, UnexplainedPost } from './permit-sync.service';

@Injectable()
export class PermitSyncWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly authService: AuthService,
    private readonly permitSyncService: PermitSyncService,
    private readonly cacheManager: CacheManager,
  ) {}

  private readonly logger = new Logger(PermitSyncWorker.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  runPending() {
    this.jobService.add(
      new Job({
        title: 'Permit Pending Sync',
        key: `/permits/pending`,
        execute: async ({ cancelToken }) => {
          const axiosConfig = this.authService.getServerAxiosConfig();

          const results: Post[] = [];
          const loopGuard = new LoopGuard();

          let page = 1;

          while (true) {
            cancelToken.ensureRunning();

            this.logger.log(`Fetching pending posts page ${page}...`);

            const result = await rateLimit(
              posts(
                loopGuard.iter({
                  page,
                  limit: MAX_API_LIMIT,
                  tags: `status:pending`,
                }),
                axiosConfig,
              ),
            );

            results.push(...result);

            await this.permitSyncService.savePosts(
              result.map(PostEntity.fromPost),
            );

            this.logger.log(`Fetched ${result.length} pending posts`);

            if (result.length === 0) break;

            page++;
          }

          if (results.length === 0) {
            this.logger.log('No pending posts found');
            return;
          }

          const unexplained =
            await this.permitSyncService.findUnexplainedPosts();

          const pending: UnexplainedPost[] = [];

          for (const post of unexplained) {
            if (results.find((p) => p.id === post.id)) {
              pending.push(post);
            }
          }

          this.logger.log(`Found ${pending.length} definitely pending posts`);

          await Promise.all(
            chunk(pending, 100).map(async (items) => {
              await this.permitSyncService.remove(
                items.map((post) => new PermitEntity({ id: post.id })),
              );
            }),
          );

          const permitted: UnexplainedPost[] = unexplained.filter(
            (post) => !pending.find((p) => p.id === post.id),
          );

          this.logger.log(`Found ${permitted.length} permitted posts`);

          await Promise.all(
            chunk(permitted, 100).map(async (items) => {
              await this.permitSyncService.save(
                items.map(
                  (post) =>
                    new PermitEntity({
                      userId: post.uploaderId,
                      postId: post.id,
                    }),
                ),
              );
            }),
          );

          this.cacheManager.delDep(PermitEntity);
        },
      }),
    );
  }
}
