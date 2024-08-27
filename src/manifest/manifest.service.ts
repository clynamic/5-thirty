import { InjectRepository } from '@nestjs/typeorm';
import { ManifestEntity } from './manifest.entity';
import { Between, Repository } from 'typeorm';
import { DateRange } from 'src/utils';
import dayjs from 'dayjs';

export type OrderBoundary = Date | ManifestEntity;

export type OrderSide = 'start' | 'end';

export interface Order {
  lower: OrderBoundary;
  upper: OrderBoundary;
}

export class ManifestService {
  constructor(
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
  ) {}

  async save(manifest: ManifestEntity): Promise<ManifestEntity> {
    return this.manifestRepository.save(manifest);
  }

  async delete(manifest: ManifestEntity): Promise<void> {
    await this.manifestRepository.delete(manifest.id);
  }

  async listByRange(type: string, range: DateRange): Promise<ManifestEntity[]> {
    return this.manifestRepository.find({
      where: {
        type,
        startDate: Between(range.start, range.end),
        endDate: Between(range.start, range.end),
      },
    });
  }

  async listOrdersByRange(type: string, range: DateRange): Promise<Order[]> {
    const manifests = await this.listByRange(type, range);
    return ManifestService.computeOrders(manifests, range);
  }

  static getBoundaryDate(boundary: OrderBoundary, side: OrderSide): Date {
    if (boundary instanceof Date) {
      return boundary;
    }
    return side === 'start' ? boundary.startDate : boundary.endDate;
  }

  static areBoundariesContiguous(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    const date1 = dayjs(this.getBoundaryDate(boundary1, side1));
    const date2 = dayjs(this.getBoundaryDate(boundary2, side2));

    if (
      boundary1 instanceof ManifestEntity &&
      boundary2 instanceof ManifestEntity
    ) {
      const isComplete1 =
        side1 === 'start' ? boundary1.completedStart : boundary1.completedEnd;
      const isComplete2 =
        side2 === 'start' ? boundary2.completedStart : boundary2.completedEnd;

      return (
        (date1.isSame(date2) && (isComplete1 || isComplete2)) ||
        ((date1.add(1, 'day').isSame(date2) ||
          date2.add(1, 'day').isSame(date1)) &&
          isComplete1 &&
          isComplete2)
      );
    }

    if (
      boundary1 instanceof ManifestEntity ||
      boundary2 instanceof ManifestEntity
    ) {
      const manifest =
        boundary1 instanceof ManifestEntity
          ? boundary1
          : (boundary2 as ManifestEntity);
      const side = boundary1 instanceof ManifestEntity ? side1 : side2;

      const isComplete =
        side === 'start' ? manifest.completedStart : manifest.completedEnd;

      return date1.isSame(date2) && isComplete;
    }

    return date1.isSame(date2);
  }

  static isBoundaryBefore(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    const date1 = dayjs(this.getBoundaryDate(boundary1, side1));
    const date2 = dayjs(this.getBoundaryDate(boundary2, side2));

    if (
      boundary1 instanceof ManifestEntity &&
      side1 === 'start' &&
      !boundary1.completedStart
    ) {
      return date1.add(1, 'millisecond').isBefore(date2);
    }
    if (
      boundary1 instanceof ManifestEntity &&
      side1 === 'end' &&
      !boundary1.completedEnd
    ) {
      return date1.subtract(1, 'millisecond').isBefore(date2);
    }

    return date1.isBefore(date2);
  }

  static computeOrders(
    manifests: ManifestEntity[],
    dateRange: DateRange,
  ): Order[] {
    manifests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const orders: Order[] = [];
    let boundary: OrderBoundary = dateRange.start;

    for (let i = 0; i < manifests.length; i++) {
      const manifest = manifests[i];

      if (this.areBoundariesContiguous(boundary, manifest, 'end', 'start')) {
        boundary = manifest;
      } else if (this.isBoundaryBefore(boundary, manifest, 'end', 'start')) {
        orders.push({
          lower: boundary,
          upper: manifest,
        });
        boundary = manifest;
      } else if (this.isBoundaryBefore(boundary, manifest, 'end', 'end')) {
        boundary = manifest;
      }
    }

    if (
      orders.length === 0 ||
      (orders.length > 0 && orders[orders.length - 1].upper !== dateRange.end)
    ) {
      orders.push({
        lower: boundary,
        upper: dateRange.end,
      });
    }

    return orders;
  }

  static splitLongOrders(
    orders: Order[],
    maxOrderDuration: number = 7,
  ): Order[] {
    const splitOrders: Order[] = [];

    for (const order of orders) {
      const lowerDate = dayjs(
        ManifestService.getBoundaryDate(order.lower, 'start'),
      );
      const upperDate = dayjs(
        ManifestService.getBoundaryDate(order.upper, 'end'),
      );

      let currentStart = lowerDate;
      const originalLowerBoundary = order.lower;
      const originalUpperBoundary = order.upper;

      while (currentStart.isBefore(upperDate)) {
        const currentEnd = dayjs.min(
          currentStart.add(maxOrderDuration, 'day'),
          upperDate,
        );

        if (currentStart.isSame(lowerDate)) {
          splitOrders.push({
            lower: originalLowerBoundary,
            upper: currentEnd.toDate(),
          });
        } else if (currentEnd.isSame(upperDate)) {
          splitOrders.push({
            lower: currentStart.toDate(),
            upper: originalUpperBoundary,
          });
        } else {
          splitOrders.push({
            lower: currentStart.toDate(),
            upper: currentEnd.toDate(),
          });
        }

        currentStart = currentEnd.add(1, 'day');
      }
    }

    return splitOrders;
  }
}
