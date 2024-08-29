import { Injectable, Logger } from '@nestjs/common';

import { Job, JobCancelError, JobInfo } from './job.entity';

@Injectable()
export class JobService {
  private queue: Job<unknown>[] = [];
  private isProcessing = false;
  private readonly logger = new Logger(JobService.name);

  addJob<MetadataType = unknown>(job: Job<MetadataType>): void {
    if (job.key) {
      const existingJob = this.queue.find((j) => j.key === job.key);
      if (existingJob) {
        this.logger.log(
          `Job with key "${job.key}" already queued. Skipping duplicate.`,
        );
        return;
      }
    }

    this.queue.push(job as Job<unknown>);
    this.logger.log(
      `[#${job.id}] [${job.title}] added to the queue. (${this.queue.length} jobs in queue)`,
    );
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        this.logger.log(`[#${job.id}] [${job.title}] is starting`);
        try {
          job.cancelToken.ensureRunning();
          await job.run();
          this.logger.log(
            `[#${job.id}] [${job.title}] completed successfully.`,
          );
        } catch (error) {
          if (error instanceof JobCancelError) {
            this.logger.warn(`[#${job.id}] [${job.title}] was cancelled.`);
          } else if (error instanceof Error) {
            this.logger.error(
              `[#${job.id}] [${job.title}] failed`,
              error.message,
              error.stack,
            );
          }
        }
      }
      this.logger.log(`(${this.queue.length} jobs remaining in queue)`);
    }
    this.isProcessing = false;
  }

  cancelJob(jobId: number, reason?: string): void {
    const job = this.queue.find((j) => j.id === jobId);
    if (job) {
      job.cancelToken.cancel(reason);
      this.logger.warn(
        `Job [#${jobId}] ${job.title} has been marked as cancelled${
          reason ? `: ${reason}` : '.'
        }`,
      );
    }
  }

  list(): JobInfo[] {
    return this.queue.map((job) => job.info);
  }
}
