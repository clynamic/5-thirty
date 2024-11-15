export class JobInfo {
  constructor(value: JobInfo) {
    Object.assign(this, value);
  }

  id: number;
  title: string;
  key?: string;
  startedAt?: Date;
  endedAt?: Date;
  succeeded: boolean;
  failed: boolean;
  cancelled: boolean;
}
