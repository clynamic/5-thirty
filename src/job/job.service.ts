import { Injectable, Logger } from '@nestjs/common';
import { PaginationParams } from 'src/common';

import { JobInfo } from './job.dto';
import { Job, JobCancelError } from './job.entity';

@Injectable()
export class JobService {
  private jobs: Job<unknown>[] = [];
  private queues: Map<string, Job<unknown>[]> = new Map();
  private processingFlags: Map<string, boolean> = new Map();
  private readonly logger = new Logger(JobService.name);

  add<MetadataType = unknown>(job: Job<MetadataType>): void {
    const queueKey = job.queue;

    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
      this.processingFlags.set(queueKey, false);
    }

    const queue = this.queues.get(queueKey)!;

    if (job.key) {
      const existingJob = queue.find((j) => j.key === job.key);
      if (existingJob) {
        this.logger.log(
          `[${queueKey}] Job with key "${job.key}" already queued. Skipping duplicate.`,
        );
        return;
      }
    }

    // limit the queue to 1000 items to prevent potential infinite backlog:
    if (queue.length >= 1000) {
      this.logger.warn(
        `[${queueKey}] Queue is full. Skipping job "${job.title}" with key "${job.key}".`,
      );
      return;
    }
    queue.push(job as Job<unknown>);

    // limit the jobs array to 5000 items to prevent outrageous memory usage:
    if (this.jobs.length >= 5000) {
      this.jobs = this.jobs.slice(-5000);
    }
    this.jobs.push(job as Job<unknown>);

    this.logger.log(
      `[#${job.id}] [${job.title}] added to [${queueKey}] queue. (${queue.length} jobs in queue)`,
    );
    void this.processQueue(queueKey);
  }

  private async processQueue(queueKey: string): Promise<void> {
    if (this.processingFlags.get(queueKey)) return;

    const queue = this.queues.get(queueKey);
    if (!queue) return;

    this.processingFlags.set(queueKey, true);
    while (queue.length > 0) {
      const job = queue.shift();
      if (job) {
        this.logger.log(
          `[#${job.id}] [${job.title}] is starting on [${queueKey}] queue`,
        );
        try {
          job.cancelToken.ensureRunning();
          let timeout: NodeJS.Timeout | undefined;
          if (job.timeout) {
            timeout = setTimeout(() => {
              job.cancelToken.cancel(`Timed out after ${job.timeout} ms`);
            }, job.timeout);
          }
          await job.run();
          if (timeout) {
            clearTimeout(timeout);
          }
          this.logger.log(
            `[#${job.id}] [${job.title}] completed successfully.`,
          );
        } catch (error) {
          if (error instanceof JobCancelError) {
            this.logger.warn(`[#${job.id}] [${job.title}] was cancelled.`);
          } else if (error instanceof Error) {
            const errorMessage = error.message || 'Unknown error';
            const errorName = error.name || 'Error';
            const stackTrace = error.stack?.split('\n').slice(0, 5).join('\n');

            this.logger.error(
              `[#${job.id}] [${job.title}] failed: ${errorName}: ${errorMessage}`,
              stackTrace,
            );
          }
        }
      }
      this.logger.log(
        `[${queueKey}] (${queue.length} jobs remaining in queue)`,
      );
    }
    this.processingFlags.delete(queueKey);
    this.queues.delete(queueKey);
  }

  cancel(jobId: number, reason?: string): void {
    for (const queue of this.queues.values()) {
      const job = queue.find((j) => j.id === jobId);
      if (job) {
        job.cancelToken.cancel(reason);
        this.logger.warn(
          `Job [#${jobId}] ${job.title} has been marked as cancelled${
            reason ? `: ${reason}` : '.'
          }`,
        );
        return;
      }
    }
  }

  list(pages?: PaginationParams): JobInfo[] {
    const offset = PaginationParams.calculateOffset(pages);
    const limit = pages?.limit ?? PaginationParams.DEFAULT_PAGE_SIZE;
    return this.jobs
      .map((job) => job.info)
      .sort((a, b) => b.id - a.id)
      .slice(offset, offset + limit);
  }
}
