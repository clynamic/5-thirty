import { JobInfo } from './job.dto';

export class JobCancelError extends Error {
  constructor(reason?: string) {
    super(`Job has been cancelled${reason ? `: ${reason}` : '.'}`);
    this.name = JobCancelError.name;
  }
}

export class JobCancelToken {
  constructor() {
    this._isCancelled = false;
  }

  private _isCancelled: boolean;

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  reason?: string;

  cancel(reason?: string): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    this.reason = reason;
  }

  ensureRunning(): void {
    if (this.isCancelled) {
      throw new JobCancelError(this.reason);
    }
  }
}

export interface JobConfig<MetadataType = undefined> {
  metadata: MetadataType;
  cancelToken: JobCancelToken;
}

export type JobExecution<MetadataType = undefined> = (
  options: JobConfig<MetadataType>,
) => Promise<void>;

export interface JobOptions<MetadataType = undefined> {
  /**
   * The title of this job. Used for display purposes.
   */
  title?: string;

  /**
   * The key of this job. used for deduplication purposes.
   * Jobs with no key are unique and will always run.
   */
  key?: string;

  /**
   * The metadata for this job.
   * Can contain any arbitrary data that the job needs to run.
   */
  metadata?: MetadataType;

  /**
   * The cancel token for this job. Can be used to check if the job should continue running.
   */
  cancelToken?: JobCancelToken;

  /**
   * The timeout for this job.
   * If the job runs for longer than this, it will be cancelled by the job service.
   */
  timeout?: number;

  /**
   * The function that will be executed when the job is run.
   */
  execute: JobExecution<MetadataType>;
}

export class Job<MetadataType = undefined> {
  constructor(options: JobOptions<MetadataType>) {
    this.id = Job.idCounter++;
    this.title = options.title || `Untitled Job`;
    this.key = options.key;
    this.metadata = options.metadata;
    this.cancelToken = options.cancelToken || new JobCancelToken();
    this.timeout = options.timeout;
    this.execute = options.execute;
  }

  /**
   * Used to generate unique IDs for each job.
   */
  private static idCounter = 0;

  /**
   * The unique identifier for this job.
   */
  readonly id: number;

  /**
   * The title of this job. Used for display purposes.
   */
  readonly title: string;

  /**
   * The key of this job. used for deduplication purposes.
   * Jobs with no key are unique and will always run.
   */
  readonly key?: string;

  /**
   * The metadata for this job.
   * Can contain any arbitrary data that the job needs to run.
   */
  readonly metadata?: MetadataType;

  /**
   * The cancel token for this job. Can be used to check if the job should continue running.
   */
  readonly cancelToken: JobCancelToken;

  /**
   * The timeout for this job.
   * If the job runs for longer than this, it will be cancelled by the job service.
   * Is no timeout provided, the job will run until it completes.
   */
  readonly timeout?: number;

  /**
   * The function that will be executed when the job is run.
   */
  private readonly execute: JobExecution<MetadataType>;

  private _promise?: Promise<void>;

  private _startedAt?: Date;
  get startedAt(): Date | undefined {
    return this._startedAt;
  }

  private _endedAt?: Date;
  get endedAt(): Date | undefined {
    return this._endedAt;
  }

  private _error?: unknown;
  get error(): unknown {
    return this._error;
  }

  get running(): boolean {
    return !!this._startedAt && !this._endedAt;
  }

  get succeeded(): boolean {
    return !!this._endedAt && !this.failed && !this.cancelled;
  }

  get failed(): boolean {
    return this._error !== undefined;
  }

  get cancelled(): boolean {
    return this.cancelToken.isCancelled;
  }

  get runtime(): number | undefined {
    if (!this.startedAt || !this.endedAt) return undefined;
    return this.endedAt.getTime() - this.startedAt.getTime();
  }

  get timedOut(): boolean {
    return (
      !!this.timeout &&
      !!this.runtime &&
      this.cancelled &&
      this.runtime >= this.timeout
    );
  }

  get info(): JobInfo {
    return new JobInfo({
      id: this.id,
      title: this.title,
      key: this.key,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      succeeded: this.succeeded,
      failed: this.failed,
      cancelled: this.cancelled,
      timedOut: this.timedOut,
    });
  }

  async run(): Promise<void> {
    if (this.running) return this._promise;
    try {
      this._startedAt = new Date();
      this.cancelToken.ensureRunning();
      this._promise = this.execute({
        cancelToken: this.cancelToken,
        metadata: this.metadata as MetadataType,
      });
      await this._promise;
    } catch (error) {
      this._error = error;
      throw error;
    } finally {
      this._endedAt = new Date();
    }
  }
}
