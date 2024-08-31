import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum DashboardType {
  moderator = 'moderator',
  janitor = 'janitor',
}

@Entity('dashboards')
export class DashboardEntity {
  @PrimaryColumn({ type: 'simple-enum', enum: DashboardType })
  type: DashboardType;

  @PrimaryColumn({ type: 'int' })
  userId: number;

  @Column({ type: 'json' })
  layout: string;

  @Column({ type: 'json' })
  config: string;
}
