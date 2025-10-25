import { Injectable, Logger } from '@nestjs/common';
import { PaginationParams } from 'src/common';

import { JobInfo } from './job.dto';
import { Job, JobCancelError } from './job.entity';

@Injectable()
export class JobService {
  private jobs: Job<unknown>[] = [];
  private queue: Job<unknown>[] = [];
  private isProcessing = false;
  private readonly logger = new Logger(JobService.name);

  add<MetadataType = unknown>(job: Job<MetadataType>): void {
    if (job.key) {
      const existingJob = this.queue.find((j) => j.key === job.key);
      if (existingJob) {
        this.logger.log(
          `Job with key "${job.key}" already queued. Skipping duplicate.`,
        );
        return;
      }
    }

    // limit the queue to 1000 items to prevent potential infinite backlog:
    if (this.queue.length >= 1000) {
      this.logger.warn(
        `Queue is full. Skipping job "${job.title}" with key "${job.key}".`,
      );
      return;
    }
    this.queue.push(job as Job<unknown>);

    // limit the jobs array to 5000 items to prevent outrageous memory usage:
    if (this.jobs.length >= 5000) {
      this.jobs = this.jobs.slice(-5000);
    }
    this.jobs.push(job as Job<unknown>);

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
            this.logger.error(
              `[#${job.id}] [${job.title}] failed: ${error.message}`,
              error.stack,
            );
          }
        }
      }
      this.logger.log(`(${this.queue.length} jobs remaining in queue)`);
    }
    this.isProcessing = false;
  }

  cancel(jobId: number, reason?: string): void {
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

  list(pages?: PaginationParams): JobInfo[] {
    const offset = PaginationParams.calculateOffset(pages);
    const limit = pages?.limit ?? PaginationParams.DEFAULT_PAGE_SIZE;
    return this.jobs
      .map((job) => job.info)
      .sort((a, b) => b.id - a.id)
      .slice(offset, offset + limit);
  }
}
