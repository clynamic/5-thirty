import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DateRange, FunkyCronExpression, chunkDateRange } from 'src/common';
import { Job } from 'src/job/job.entity';
import { JobService } from 'src/job/job.service';
import { ItemType } from 'src/label/label.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { MoreThan, Repository } from 'typeorm';

import { PostLifecycleService } from '../post-lifecycle.service';

@Injectable()
export class UploadLifecycleWorker {
  constructor(
    private readonly jobService: JobService,
    private readonly lifecycleService: PostLifecycleService,
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

  private readonly logger = new Logger(UploadLifecycleWorker.name);
  // TODO: Persist this across restarts
  private lastProcessedTime: Date | null = null;

  @Cron(FunkyCronExpression.EVERY_3_MINUTES)
  async runSync() {
    this.jobService.add(
      new Job({
        title: 'Post Upload Lifecycle Sync',
        key: `/post-lifecycle/uploads`,
        queue: 'tiling',
        timeout: 1000 * 60 * 5,
        execute: async ({ cancelToken }) => {
          const manifests = await this.manifestRepository.find({
            where: {
              type: ItemType.postVersions,
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

              const uploads = await this.postVersionRepository.find({
                where: {
                  version: 1,
                  updatedAt: chunk.find(),
                },
                select: ['postId', 'updatedAt'],
              });

              if (uploads.length === 0) continue;

              this.logger.log(
                `Syncing ${uploads.length} uploads for ${chunk.toE621RangeString()}`,
              );

              await this.lifecycleService.upsertUploads(
                uploads.map((upload) => ({
                  postId: upload.postId,
                  uploadedAt: upload.updatedAt,
                })),
              );
            }
          }

          this.lastProcessedTime = new Date();
        },
      }),
    );
  }
}
