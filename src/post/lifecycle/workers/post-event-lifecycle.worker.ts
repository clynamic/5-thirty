import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEventAction } from 'src/api';
import { DateRange, FunkyCronExpression, chunkDateRange } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { MoreThan, Repository } from 'typeorm';

import { PostLifecycleService } from '../post-lifecycle.service';

@Injectable()
export class PostEventLifecycleWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly lifecycleService: PostLifecycleService,
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
  ) {}

  private readonly logger = new Logger(PostEventLifecycleWorker.name);
  // TODO: Persist this across restarts
  private lastProcessedTime: Date | null = null;

  @Cron(FunkyCronExpression.EVERY_3_MINUTES)
  async runSync() {
    this.jobService.add(
      new Job({
        title: 'Post Event Lifecycle Sync',
        key: `/post-lifecycle/post-events`,
        queue: 'tiling',
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const manifests = await this.manifestRepository.find({
            where: {
              type: ItemType.postEvents,
              ...(this.lastProcessedTime && {
                updatedAt: MoreThan(this.lastProcessedTime),
              }),
            },
          });

          if (manifests.length === 0) return;

          for (const manifest of manifests) {
            cancelToken.ensureRunning();

            const range = new DateRange({
              startDate: manifest.startDate,
              endDate: manifest.endDate,
            });

            const chunks = chunkDateRange(range, 30);

            for (const chunk of chunks) {
              cancelToken.ensureRunning();

              const events: {
                post_id: number;
                created_at: Date;
                action: string;
              }[] = await this.postEventRepository.query(
                `
                SELECT DISTINCT ON (pe.post_id)
                  pe.post_id,
                  pe.created_at,
                  pe.action
                FROM post_events pe
                WHERE pe.action IN ($1, $2, $3, $4)
                  AND pe.created_at >= $5 AND pe.created_at < $6
                ORDER BY pe.post_id, pe.created_at DESC
                `,
                [
                  PostEventAction.approved,
                  PostEventAction.unapproved,
                  PostEventAction.deleted,
                  PostEventAction.undeleted,
                  chunk.startDate,
                  chunk.endDate,
                ],
              );

              if (events.length === 0) continue;

              this.logger.log(
                `Syncing ${events.length} post events for ${chunk.toE621RangeString()}`,
              );

              const approvals = events
                .filter(
                  (e) =>
                    e.action === PostEventAction.approved ||
                    e.action === PostEventAction.undeleted,
                )
                .map((e) => ({
                  postId: e.post_id,
                  approvedAt: e.created_at,
                }));

              const unapprovals = events
                .filter((e) => e.action === PostEventAction.unapproved)
                .map((e) => ({
                  postId: e.post_id,
                  approvedAt: null,
                }));

              const deletions = events
                .filter((e) => e.action === PostEventAction.deleted)
                .map((e) => ({
                  postId: e.post_id,
                  deletedAt: e.created_at,
                }));

              const undeletions = events
                .filter((e) => e.action === PostEventAction.undeleted)
                .map((e) => ({
                  postId: e.post_id,
                  deletedAt: null,
                }));

              if (approvals.length > 0 || unapprovals.length > 0) {
                await this.lifecycleService.upsertApprovals([
                  ...approvals,
                  ...unapprovals,
                ]);
              }

              if (deletions.length > 0 || undeletions.length > 0) {
                await this.lifecycleService.upsertDeletions([
                  ...deletions,
                  ...undeletions,
                ]);
              }
            }
          }

          this.lastProcessedTime = new Date();
        },
      }),
    );
  }
}
