import {
  DashboardMeta,
  DashboardPositions,
  DashboardType,
} from './dashboard.entity';

export class DashboardConfig {
  constructor(partial?: Partial<DashboardConfig>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  type: DashboardType;
  userId: number;
  positions: DashboardPositions;
  meta: DashboardMeta;
}

export class DashboardUpdate {
  positions?: DashboardPositions;
  meta?: DashboardMeta;
}
