import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum DashboardType {
  moderator = 'moderator',
  janitor = 'janitor',
  admin = 'admin',
}

export class DashboardPosition {
  constructor(partial?: Partial<DashboardPosition>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class DashboardPositions {
  constructor(partial?: Partial<DashboardPositions>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  xs?: DashboardPosition[];
  sm?: DashboardPosition[];
  md?: DashboardPosition[];
  lg?: DashboardPosition[];
  xl?: DashboardPosition[];
}

export type DashboardMeta = Record<string, unknown>;

@Entity('dashboards')
export class DashboardEntity {
  @PrimaryColumn({ type: 'simple-enum', enum: DashboardType })
  type: DashboardType;

  @PrimaryColumn({ type: 'int' })
  userId: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'json' })
  positions: DashboardPositions;

  @Column({ type: 'json' })
  meta: DashboardMeta;
}
