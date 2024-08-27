import { DateRange } from 'src/utils';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('manifests')
export class ManifestEntity {
  constructor(partial?: Partial<ManifestEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'boolean', default: false })
  completedStart: boolean;

  @Column({ type: 'date' })
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
