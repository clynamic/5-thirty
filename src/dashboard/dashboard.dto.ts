import { Length } from 'class-validator';

export class Dashboard {
  constructor(partial?: Partial<Dashboard>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  id: string;
  type: string;
  userId: number;
  layout: string;
  config: string;
}

export class DashboardUpdate {
  @Length(0, 1000000)
  layout?: string;
  @Length(0, 1000000)
  config?: string;
}
