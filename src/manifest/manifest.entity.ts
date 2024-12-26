import { DateRange, WithDate, WithId } from 'src/common';
import { ItemType } from 'src/label/label.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('manifests')
export class ManifestEntity {
  constructor(partial?: Partial<ManifestEntity>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'simple-enum', enum: ItemType })
  type: ItemType;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ type: 'datetime', nullable: true })
  refreshedAt?: Date;

  get range(): DateRange {
    return new DateRange({
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }

  @Column({ type: 'int' })
  lowerId: number;

  @Column({ type: 'int' })
  upperId: number;

  /**
   * In-place extend the manifest entity in the given direction.
   * Undefined values are not updated.
   * Returns the entity for chaining.
   */
  extend(side: OrderSide, date?: Date, id?: number) {
    if (side === 'start') {
      // extend downwards
      this.lowerId = id ?? this.lowerId;
      this.startDate = date ?? this.startDate;
    } else if (side === 'end') {
      // extend upwards
      this.upperId = id ?? this.upperId;
      this.endDate = date ?? this.endDate;
    }

    return this;
  }

  /**
   * In-place extend this manifest to the given other.
   * The side of extension is passed or determined by date comparison,
   * then by id comparison, then default to treating this manifest as the lower one.
   */
  extendWith(other: ManifestEntity, side?: OrderSide) {
    if (!side) {
      if (other.startDate < this.startDate) {
        side = 'start';
      } else if (other.endDate > this.endDate) {
        side = 'end';
      } else if (other.startDate === this.startDate) {
        side = other.id < this.id ? 'start' : 'end';
      }
    }

    if (side === 'start') {
      return this.extend('start', other.startDate, other.lowerId);
    } else {
      return this.extend('end', other.endDate, other.upperId);
    }
  }
}

export type OrderBoundary = Date | ManifestEntity;

export type OrderResult = WithId & WithDate;

export interface OrderResults {
  type: ItemType;
  order: Order;
  items: OrderResult[];
  exhausted: boolean;
}

export type OrderSide = 'start' | 'end';

export class Order {
  constructor(partial?: Partial<Order>) {
    Object.assign(this, partial);
  }

  lower: OrderBoundary;
  upper: OrderBoundary;

  static getBoundaryDate(boundary: OrderBoundary, side: OrderSide): Date {
    if (boundary instanceof Date) {
      return boundary;
    }
    return side === 'start' ? boundary.startDate : boundary.endDate;
  }

  get lowerDate(): Date {
    return Order.getBoundaryDate(this.lower, 'end');
  }

  get upperDate(): Date {
    return Order.getBoundaryDate(this.upper, 'start');
  }

  get lowerId(): number | undefined {
    return this.lower instanceof ManifestEntity
      ? this.lower.upperId
      : undefined;
  }

  get upperId(): number | undefined {
    return this.upper instanceof ManifestEntity
      ? this.upper.lowerId
      : undefined;
  }

  toDateRange(): DateRange {
    return new DateRange({
      startDate: this.lowerDate,
      endDate: this.upperDate,
    });
  }
}
