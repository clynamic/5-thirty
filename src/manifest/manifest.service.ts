import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import {
  DateRange,
  findHighestId,
  findLowestDate,
  findLowestId,
} from 'src/utils';
import { Between, LessThan, MoreThan, Repository } from 'typeorm';

import {
  ManifestEntity,
  ManifestType,
  Order,
  OrderBoundary,
  OrderResults,
  OrderSide,
} from './manifest.entity';

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

  async listByRange(
    type: ManifestType,
    range: DateRange,
  ): Promise<ManifestEntity[]> {
    return this.manifestRepository.find({
      where: [
        {
          type,
          startDate: Between(range.startDate, range.endDate),
        },
        {
          type,
          endDate: Between(range.startDate, range.endDate),
        },
        {
          type,
          startDate: LessThan(range.startDate),
          endDate: MoreThan(range.endDate),
        },
      ],
    });
  }

  async listOrdersByRange(
    type: ManifestType,
    range: DateRange,
  ): Promise<Order[]> {
    const manifests = await this.listByRange(type, range);
    return ManifestService.computeOrders(manifests, range);
  }

  static areBoundariesContiguous(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    const date1 = dayjs(Order.getBoundaryDate(boundary1, side1));
    const date2 = dayjs(Order.getBoundaryDate(boundary2, side2));

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
    const date1 = dayjs(Order.getBoundaryDate(boundary1, side1));
    const date2 = dayjs(Order.getBoundaryDate(boundary2, side2));

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
    let boundary: OrderBoundary = dateRange.startDate;

    for (const manifest of manifests) {
      if (this.areBoundariesContiguous(boundary, manifest, 'end', 'start')) {
        boundary = manifest;
      } else if (this.isBoundaryBefore(boundary, manifest, 'end', 'start')) {
        orders.push(
          new Order({
            lower: boundary,
            upper: manifest,
          }),
        );
        boundary = manifest;
      } else if (this.isBoundaryBefore(boundary, manifest, 'end', 'end')) {
        boundary = manifest;
      }
    }

    if (
      orders.length === 0 ||
      (orders.length > 0 &&
        orders[orders.length - 1]!.upper !== dateRange.endDate)
    ) {
      orders.push(
        new Order({
          lower: boundary,
          upper: dateRange.endDate,
        }),
      );
    }

    return orders;
  }

  static splitLongOrders(
    orders: Order[],
    maxOrderDuration: number = 7,
  ): Order[] {
    const splitOrders: Order[] = [];

    for (const order of orders) {
      const lowerDate = dayjs(order.lowerDate);
      const upperDate = dayjs(order.upperDate);

      let currentStart = lowerDate;
      const originalLowerBoundary = order.lower;
      const originalUpperBoundary = order.upper;

      while (currentStart.isBefore(upperDate)) {
        const currentEnd = dayjs.min(
          currentStart.add(maxOrderDuration, 'day'),
          upperDate,
        );

        if (currentStart.isSame(lowerDate)) {
          splitOrders.push(
            new Order({
              lower: originalLowerBoundary,
              upper: currentEnd.toDate(),
            }),
          );
        } else if (currentEnd.isSame(upperDate)) {
          splitOrders.push(
            new Order({
              lower: currentStart.toDate(),
              upper: originalUpperBoundary,
            }),
          );
        } else {
          splitOrders.push(
            new Order({
              lower: currentStart.toDate(),
              upper: currentEnd.toDate(),
            }),
          );
        }

        currentStart = currentEnd.add(1, 'day');
      }
    }

    return splitOrders;
  }

  async saveResults({
    type,
    order,
    items,
    exhausted,
  }: OrderResults): Promise<void> {
    const currentDate = dayjs().utc().startOf('day');

    exhausted = exhausted ?? items.length === 0;

    if (!exhausted) {
      // we assume that data is paginated newest to oldest,
      // therefore we create an upper boundary.
      // if this is not the case, we need to expand our logic,
      // to allow starting at a lower boundary instead.
      if (order.upper instanceof ManifestEntity) {
        // extend upper downwards
        this.save(
          order.upper.extend(
            'start',
            findLowestDate(items)?.createdAt,
            findLowestId(items)?.id,
            false,
          ),
        );
      } else {
        // create new manifest
        order.upper = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: findLowestDate(items)!.createdAt,
          completedStart: false,
          endDate: dayjs.min(dayjs(order.upper), currentDate).toDate(),
          completedEnd: dayjs(order.upper).isBefore(currentDate),
        });

        this.save(order.upper);
      }
    } else {
      if (order.upper instanceof ManifestEntity) {
        if (order.lower instanceof ManifestEntity) {
          this.merge(order.lower, order.upper);
        } else {
          // extend upper downwards
          this.save(
            order.upper.extend(
              'start',
              order.lower,
              findLowestId(items)?.id,
              true,
            ),
          );
        }
      } else if (order.lower instanceof ManifestEntity) {
        // extend lower upwards
        this.save(
          order.lower.extend(
            'end',
            dayjs.min(dayjs(order.upper), currentDate).toDate(),
            findHighestId(items)?.id,
            dayjs(order.lower.endDate).isBefore(currentDate),
          ),
        );
      } else if (items.length > 0) {
        // create new manifest
        order.upper = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: order.lower,
          completedStart: true,
          endDate: dayjs.min(dayjs(order.upper), currentDate).toDate(),
          completedEnd: dayjs(order.upper).isBefore(currentDate),
        });

        this.save(order.upper);
      } else {
        // abort without data
      }
    }
  }

  async mergeInRange(type: ManifestType, range: DateRange): Promise<void> {
    const manifests = await this.listByRange(type, range);

    manifests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < manifests.length; i++) {
      const manifestA = manifests[i]!;

      while (i + 1 < manifests.length) {
        const manifestB = manifests[i + 1]!;

        if (dayjs(manifestB.endDate).isBefore(manifestA.endDate)) {
          await this.delete(manifestB);
          i++;
        } else if (dayjs(manifestB.startDate).isBefore(manifestA.endDate)) {
          const newEndDate = dayjs(manifestA.endDate).isAfter(manifestB.endDate)
            ? manifestA.endDate
            : manifestB.endDate;
          const newCompletedEnd =
            newEndDate === manifestA.endDate
              ? manifestA.completedEnd
              : manifestB.completedEnd;

          manifestA.endDate = newEndDate;
          manifestA.completedEnd = newCompletedEnd;

          await this.delete(manifestB);
          i++;
        } else if (
          dayjs(manifestB.startDate).isSame(
            dayjs(manifestA.endDate).add(1, 'day'),
          ) &&
          manifestA.completedEnd &&
          manifestB.completedStart
        ) {
          manifestA.endDate = manifestB.endDate;
          manifestA.completedEnd = manifestB.completedEnd;

          await this.delete(manifestB);
          i++;
        } else {
          break;
        }
      }

      await this.save(manifestA);
    }
  }

  async merge(
    lower: ManifestEntity,
    upper: ManifestEntity,
  ): Promise<ManifestEntity> {
    lower.extendWith(upper, 'end');

    await this.manifestRepository.remove(upper);
    return this.manifestRepository.save(lower);
  }
}
