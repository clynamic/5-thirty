import { InjectRepository } from '@nestjs/typeorm';
import { add, addMilliseconds, isEqual, min, startOfDay, sub } from 'date-fns';
import {
  DateRange,
  endOf,
  findHighestId,
  findLowestDate,
  findLowestId,
  resolveWithDate,
  startOf,
  TimeScale,
  toRawQuery,
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
import { Cacheable, withInvalidation } from 'src/app/browser.module';

import { ManifestQuery, ManifestAvailability } from './manifest.dto';
import {
  ManifestEntity,
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

  save = withInvalidation(
    this.manifestRepository.save.bind(this.manifestRepository),
    ManifestEntity,
  );

  remove = withInvalidation(
    this.manifestRepository.remove.bind(this.manifestRepository),
    ManifestEntity,
  );

  static getManifestKey(id: number): string {
    return `manifest?${toRawQuery({ id })}`;
  }

  @Cacheable(ManifestService.getManifestKey, {
    ttl: 60 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
  async get(id: number): Promise<ManifestEntity | null> {
    return this.manifestRepository.findOne({
      where: { id },
    });
  }

  private whereInRange(
    range?: DateRange,
    options?: FindOptionsWhere<ManifestEntity>,
  ): FindOptionsWhere<ManifestEntity>[] {
    range = range?.expand(TimeScale.Day);

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

  static getListKey(range?: DateRange, query?: ManifestQuery): string {
    return `manifest-list?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(ManifestService.getListKey, {
    ttl: 30 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
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

  static getOrdersByRangeKey(type: ItemType, range: DateRange): string {
    return `orders-list?${toRawQuery({ type, ...range })}`;
  }

  @Cacheable(ManifestService.getOrdersByRangeKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
  async listOrdersByRange(type: ItemType, range: DateRange): Promise<Order[]> {
    range = range.expand(TimeScale.Day);
    const manifests = await this.list(range, { type: [type] });
    return ManifestService.computeOrders(manifests, range);
  }

  static getAvailableKey(range: DateRange, type: ItemType[]): string {
    return `manifest-available?${toRawQuery({ ...range, type })}`;
  }

  @Cacheable(ManifestService.getAvailableKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
  async available(
    range: DateRange,
    type: ItemType[],
  ): Promise<ManifestAvailability> {
    const manifests = await this.list(range, { type: type });
    const rangeStart = range.startDate.getTime();
    const rangeEnd = range.endDate.getTime();
    const nowTime = startOfDay(Date.now()).getTime();

    const totalDuration = rangeEnd - rangeStart;
    const pastDuration = Math.max(0, Math.min(nowTime, rangeEnd) - rangeStart);
    const futureDuration = totalDuration - pastDuration;

    const availability: Partial<Record<ItemType, number>> = {};

    for (const itemType of type) {
      const filtered = manifests.filter((m) => m.type === itemType);

      if (filtered.length === 0) {
        availability[itemType] = 0;
        continue;
      }

      const orders = ManifestService.computeOrders(filtered, range);

      if (orders.length === 0) {
        availability[itemType] = 1;
        continue;
      }

      let totalGaps = 0;

      for (const order of orders) {
        const orderStart = Math.max(order.lowerDate.getTime(), rangeStart);
        const orderEnd = Math.min(order.upperDate.getTime(), rangeEnd);
        const orderDuration = Math.max(0, orderEnd - orderStart);
        totalGaps += orderDuration;
      }

      if (pastDuration === 0) {
        availability[itemType] = 1;
      } else {
        const pastGaps = Math.max(0, totalGaps - futureDuration);
        availability[itemType] = Math.max(0, 1 - pastGaps / pastDuration);
      }
    }

    return new ManifestAvailability({
      ...availability,
    });
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

  async saveResults({
    type,
    order,
    items,
    exhausted,
  }: OrderResults): Promise<void> {
    const currentDate = startOf(TimeScale.Day, new Date());

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
            resolveWithDate(findLowestDate(items)),
            findLowestId(items)?.id,
          ),
        );
      } else {
        // create new manifest
        order.upper = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: resolveWithDate(findLowestDate(items)!),
          endDate: min([order.upper, currentDate]),
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
            order.upper.extend('start', order.lower, findLowestId(items)?.id),
          );
        }
      } else if (order.lower instanceof ManifestEntity) {
        // extend lower upwards
        this.save(
          order.lower.extend(
            'end',
            min([order.upper, currentDate]),
            findHighestId(items)?.id,
          ),
        );
      } else if (items.length > 0) {
        // create new manifest
        order.upper = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: order.lower,
          endDate: min([order.upper, currentDate]),
        });

        this.save(order.upper);
      } else {
        // abort without data
      }
    }
  }

  async mergeInRange(type: ItemType, range: DateRange): Promise<void> {
    const manifests = await this.list(range, { type: [type] });

    manifests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < manifests.length; i++) {
      const manifestA = manifests[i]!;

      while (i + 1 < manifests.length) {
        const manifestB = manifests[i + 1]!;

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
        await this.remove(upper);
      }
      return this.save(lower);
    } else {
      upper.extendWith(lower, 'start');

      if (lower.id) {
        await this.remove(lower);
      }
      return this.save(upper);
    }
  }
}
