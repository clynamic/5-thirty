import { Raw } from 'src/common';

import {
  DashboardMeta,
  DashboardPositions,
  DashboardType,
} from './dashboard.entity';

export class DashboardConfig {
  constructor(value: Raw<DashboardConfig>) {
    Object.assign(this, value);
  }

  type: DashboardType;
  userId: number;
  version: number;
  positions: DashboardPositions;
  meta: DashboardMeta;
}

export class DashboardUpdate {
  constructor(value: Raw<DashboardUpdate>) {
    Object.assign(this, value);
  }

  version?: number;
  positions?: DashboardPositions;
  meta?: DashboardMeta;
}
