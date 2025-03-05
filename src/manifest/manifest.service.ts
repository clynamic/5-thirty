import { InjectRepository } from '@nestjs/typeorm';
import {
  add,
  addMilliseconds,
  endOfMonth,
  getMonth,
  isEqual,
  isSameMonth,
  min,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import {
  DateRange,
  endOf,
  findHighestId,
  findLowestDate,
  findLowestId,
  resolveWithDate,
  startOf,
  TimeScale,
} from 'src/common';
import { ItemType } from 'src/label/label.entity';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';

import { ManifestQuery } from './manifest.dto';
import {
  ManifestEntity,
  Order,
  OrderBoundary,
  OrderResult,
  OrderResults,
  OrderSide,
} from './manifest.entity';

export class ManifestService {
  constructor(
    @InjectRepository(ManifestEntity)
    private readonly manifestRepository: Repository<ManifestEntity>,
  ) {}

  async get(id: number): Promise<ManifestEntity | null> {
    return this.manifestRepository.findOne({
      where: { id },
    });
  }

  save = this.manifestRepository.save.bind(this.manifestRepository);

  remove = this.manifestRepository.remove.bind(this.manifestRepository);

  private whereInRange(
    range?: DateRange,
    options?: FindOptionsWhere<ManifestEntity>,
  ): FindOptionsWhere<ManifestEntity>[] {
    return [
      ...(range
        ? [
            {
              ...options,
              startDate: Between(range.startDate, range.endDate),
            },
            {
              ...options,
              endDate: Between(range.startDate, range.endDate),
            },
            {
              ...options,
              startDate: LessThan(range.startDate),
              endDate: MoreThan(range.endDate),
            },
          ]
        : [
            {
              ...options,
            },
          ]),
    ];
  }

  async list(
    range?: DateRange,
    query?: ManifestQuery,
  ): Promise<ManifestEntity[]> {
    return this.manifestRepository.find({
      where: query?.id
        ? { id: query.id }
        : this.whereInRange(range, query?.type ? { type: In(query.type) } : {}),
    });
  }

  async listByRange(
    type: ItemType,
    range: DateRange,
  ): Promise<ManifestEntity[]> {
    return this.manifestRepository.find({
      where: this.whereInRange(range, { type }),
    });
  }

  async listOrdersByRange(type: ItemType, range: DateRange): Promise<Order[]> {
    const manifests = await this.listByRange(type, range);
    return ManifestService.computeOrders(manifests, range);
  }

  static areBoundariesContiguous(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    const date1 = Order.getBoundaryDate(boundary1, side1);
    const date2 = Order.getBoundaryDate(boundary2, side2);

    if (
      boundary1 instanceof ManifestEntity &&
      boundary2 instanceof ManifestEntity
    ) {
      return (
        isEqual(date1, date2) ||
        isEqual(addMilliseconds(date1, 1), date2) ||
        isEqual(date1, addMilliseconds(date2, 1))
      );
    }

    if (
      boundary1 instanceof ManifestEntity ||
      boundary2 instanceof ManifestEntity
    ) {
      return isEqual(date1, date2);
    }

    return isEqual(date1, date2);
  }

  static isBoundaryBefore(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    return (
      Order.getBoundaryDate(boundary1, side1) <
      Order.getBoundaryDate(boundary2, side2)
    );
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
      const { lowerDate, upperDate } = order;

      let currentStart = lowerDate;
      const originalLowerBoundary = order.lower;
      const originalUpperBoundary = order.upper;

      while (currentStart < upperDate) {
        const currentEnd = min([
          endOf(TimeScale.Day, add(currentStart, { days: maxOrderDuration })),
          upperDate,
        ]);

        if (isEqual(currentStart, lowerDate)) {
          splitOrders.push(
            new Order({
              lower: originalLowerBoundary,
              upper: currentEnd,
            }),
          );
        } else if (isEqual(currentEnd, upperDate)) {
          splitOrders.push(
            new Order({
              lower: currentStart,
              upper: originalUpperBoundary,
            }),
          );
        } else {
          splitOrders.push(
            new Order({
              lower: currentStart,
              upper: currentEnd,
            }),
          );
        }

        currentStart = startOf(TimeScale.Day, add(currentEnd, { days: 1 }));
      }
    }

    return splitOrders;
  }

  /**
   * Saves the results of an order fetch to the database.
   * Assumes that data is paginated newest to oldest.
   */
  async saveResults({
    type,
    order,
    items,
    exhausted,
  }: OrderResults): Promise<void> {
    if (items.length === 0) {
      return;
    }

    // Split items into month-bounded manifests
    const manifests = this.splitIntoMonthlyManifests(type, order, items);
    const lastIndex = manifests.length - 1;

    // Process manifests and update the order
    for (let i = 0; i < manifests.length; i++) {
      const isLastManifest = i === lastIndex && exhausted;
      await this.updateOrderWithManifest(order, manifests[i]!, isLastManifest);
    }
  }

  private splitIntoMonthlyManifests(
    type: ItemType,
    order: Order,
    items: OrderResult[],
  ): ManifestEntity[] {
    if (items.length === 0) return [];

    const manifests: ManifestEntity[] = [];
    let currentMonth = getMonth(resolveWithDate(items[0]!));
    const currentDate = startOfDay(new Date());
    let batch: OrderResult[] = [];

    // extend from upper boundary or current date
    let rollingUpperDate = min([order.upperDate, currentDate]);

    for (const item of items) {
      const itemDate = resolveWithDate(item);

      if (itemDate < order.lowerDate) {
        // FRAGILE CODE WARNING:
        // Because of timezone shifts,
        // e621 will serve us items outside of the range we actually care about.
        // If our offset is negative, we also might be served too little items.
        // This is very bad and we must rectify this in some future refactor.
        // As long as the server account has a positive or zero offset,
        // we can simply ignore these items.
        // TODO: Add a way to modify timezone of a request in e621.
        continue;
      }

      const itemMonth = getMonth(itemDate);

      if (itemMonth !== currentMonth) {
        // finalize manifest at month boundary
        manifests.push(
          new ManifestEntity({
            type,
            upperId: findHighestId(batch)!.id,
            lowerId: findLowestId(batch)!.id,
            startDate: startOfMonth(rollingUpperDate),
            endDate: rollingUpperDate,
          }),
        );

        currentMonth = itemMonth;
        batch = [];
        rollingUpperDate = endOfMonth(itemDate);
      }

      batch.push(item);
    }

    if (batch.length > 0) {
      manifests.push(
        new ManifestEntity({
          type,
          upperId: findHighestId(batch)!.id,
          lowerId: findLowestId(batch)!.id,
          startDate: resolveWithDate(findLowestDate(batch)),
          endDate: rollingUpperDate,
        }),
      );
    }

    return manifests;
  }

  private async updateOrderWithManifest(
    order: Order,
    manifest: ManifestEntity,
    exhausted: boolean,
  ): Promise<void> {
    if (order.upper instanceof ManifestEntity) {
      if (isSameMonth(order.upperDate, manifest.endDate)) {
        // directly connecting new manifest to upper boundary
        order.upper = await this.merge(manifest, order.upper);
      } else {
        // crossing a month boundary
        order.upper = manifest;
      }
      this.save(order.upper);

      if (exhausted) {
        if (
          order.lower instanceof ManifestEntity &&
          isSameMonth(order.lowerDate, order.upperDate)
        ) {
          // close the gap in the order
          this.merge(order.lower, order.upper);
        }
      }
    } else {
      // create upper boundary
      order.upper = manifest;
      this.save(order.upper);
    }
  }

  async mergeInRange(type: ItemType, range: DateRange): Promise<void> {
    const manifests = await this.listByRange(type, range);

    manifests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < manifests.length; i++) {
      const manifestA = manifests[i]!;

      while (i + 1 < manifests.length) {
        const manifestB = manifests[i + 1]!;

        if (!isSameMonth(manifestA.endDate, manifestB.startDate)) {
          break;
        }

        if (manifestB.endDate < manifestA.endDate) {
          await this.remove(manifestB);
          i++;
        } else if (manifestB.startDate < manifestA.endDate) {
          this.merge(manifestA, manifestB);
          i++;
        } else if (
          isEqual(manifestB.startDate, addMilliseconds(manifestA.endDate, 1))
        ) {
          this.merge(manifestA, manifestB);
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
    if ((lower.id && !upper.id) || lower.id <= upper.id) {
      lower.extendWith(upper, 'end');

      if (upper.id) {
        await this.manifestRepository.remove(upper);
      }
      return this.manifestRepository.save(lower);
    } else {
      upper.extendWith(lower, 'start');

      if (lower.id) {
        await this.manifestRepository.remove(lower);
      }
      return this.manifestRepository.save(upper);
    }
  }
}
