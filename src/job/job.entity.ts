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
  execute: JobExecution<MetadataType>;
  title?: string;
  key?: string;
  metadata?: MetadataType;
  cancelToken?: JobCancelToken;
}

export class Job<MetadataType = undefined> {
  constructor(options: JobOptions<MetadataType>) {
    this.id = Job.idCounter++;
    this.title = options.title || `Untitled Job`;
    this.key = options.key;
    this.metadata = options.metadata;
    this.cancelToken = options.cancelToken || new JobCancelToken();
    this.execute = options.execute;
  }

  private static idCounter = 0;
  readonly id: number;
  readonly title: string;
  readonly key?: string;
  readonly metadata?: MetadataType;
  readonly cancelToken: JobCancelToken;
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
