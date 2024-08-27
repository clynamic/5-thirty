import { DateRange } from 'src/utils';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum ManifestType {
  approvals = 'approvals',
  tickets = 'tickets',
}

@Entity('manifests')
export class ManifestEntity {
  constructor(partial?: Partial<ManifestEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text', enum: ManifestType })
  type: ManifestType;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'boolean', default: false })
  completedStart: boolean;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ type: 'boolean', default: false })
  completedEnd: boolean;

  get range(): DateRange {
    return {
      start: this.startDate,
      end: this.endDate,
    };
  }

  get completed(): boolean {
    return this.completedStart && this.completedEnd;
  }

  @Column({ type: 'int' })
  lowerId: number;

  @Column({ type: 'int' })
  upperId: number;
}

export type OrderBoundary = Date | ManifestEntity;

export type OrderSide = 'start' | 'end';

export interface Order {
  lower: OrderBoundary;
  upper: OrderBoundary;
}
