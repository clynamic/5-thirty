import { add, addMilliseconds, isEqual, min } from 'date-fns';
import {
  DateRange,
  TimeScale,
  endOf,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  resolveWithDate,
  startOf,
} from 'src/common';
import { ItemType } from 'src/label/label.entity';

import {
  ManifestEntity,
  Order,
  OrderBoundary,
  OrderResult,
  OrderSide,
} from './manifest.entity';

export interface ManifestRewrite {
  /** Input manifests that should be removed from storage */
  discard: ManifestEntity[];
  /** Output manifests that should be saved/updated */
  results: ManifestEntity[];
}

export interface ManifestOrderUpdate {
  /** Input manifests that should be removed from storage */
  discard: ManifestEntity[];
  /** Updated order with new boundaries */
  order: Order;
}

export class ManifestUtils {
  /**
   * Calculates if two boundaries are adjacent.
   */
  static areBoundariesContiguous(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    const date1 = Order.getBoundaryDate(boundary1, side1);
    const date2 = Order.getBoundaryDate(boundary2, side2);

    return (
      isEqual(date1, date2) ||
      isEqual(addMilliseconds(date1, 1), date2) ||
      isEqual(date1, addMilliseconds(date2, 1))
    );
  }

  /**
   * Calculates whether boundary1 is strictly before boundary2.
   */
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

  /**
   * Calculates orders (gaps) between manifests within a date range.
   */
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

  /**
   * Splits orders that exceed a maximum duration into smaller orders.
   * This is useful to have smaller fully completable chunks when processing large gaps.
   */
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
   * Determines if two manifests are adjacent or overlapping.
   */
  static shouldMergeManifests(
    manifest1: ManifestEntity,
    manifest2: ManifestEntity,
  ): boolean {
    const [first, second] =
      manifest1.startDate <= manifest2.startDate
        ? [manifest1, manifest2]
        : [manifest2, manifest1];

    return (
      this.areBoundariesContiguous(first, second, 'end', 'start') ||
      !this.isBoundaryBefore(first, second, 'end', 'start')
    );
  }

  /**
   * Merge two manifests into one, discarding the other.
   * Always prefers lower ID.
   */
  static computeMerge(
    lower: ManifestEntity,
    upper: ManifestEntity,
  ): ManifestRewrite {
    // If IDs are the same, extend in place without discarding
    if (lower.id === upper.id) {
      const result = new ManifestEntity({ ...lower });
      result.extendWith(upper, 'end');
      return {
        discard: [],
        results: [result],
      };
    } else if (!upper.id || (lower.id && lower.id < upper.id)) {
      // Keep lower: either upper has no ID, or lower has a smaller ID
      const result = new ManifestEntity({ ...lower });
      result.extendWith(upper, 'end');
      return {
        discard: upper.id ? [upper] : [],
        results: [result],
      };
    } else {
      // Keep upper: upper has a smaller ID than lower (or lower has no ID)
      const result = new ManifestEntity({ ...upper });
      result.extendWith(lower, 'start');
      return {
        discard: lower.id ? [lower] : [], // Don't discard if lower has no ID
        results: [result],
      };
    }
  }

  /**
   * Compute manifest and order updates based on fetched items.
   * The logic assumes that items are fetched in descending order (newest to oldest).
   * Based on this assumption, orders are always updated by first creating an upper boundary,
   * or extending an existing upper boundary downwards.
   * If this is not the case, you are doing something wrong, and this code needs to be modified.
   */
  static computeSaveResults(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    exhausted: boolean,
  ): ManifestOrderUpdate {
    if (!exhausted) {
      if (order.upper instanceof ManifestEntity) {
        // existing upper boundary, extend downwards
        const extended = new ManifestEntity({ ...order.upper }).extend(
          'start',
          resolveWithDate(findLowestDate(items)),
          findLowestId(items)?.id,
        );
        return {
          discard: [],
          order: new Order({ ...order, upper: extended }),
        };
      } else {
        // no upper boundary, create new upper boundary
        const result = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: resolveWithDate(findLowestDate(items)!),
          endDate: resolveWithDate(findHighestDate(items)!),
        });
        return {
          discard: [],
          order: new Order({ ...order, upper: result }),
        };
      }
    } else {
      if (order.upper instanceof ManifestEntity) {
        if (order.lower instanceof ManifestEntity) {
          // gap is exhausted, close by merging
          const mergeResult = this.computeMerge(order.lower, order.upper);
          return {
            discard: mergeResult.discard,
            order: new Order({
              lower: mergeResult.results[0]!,
              upper: mergeResult.results[0]!,
            }),
          };
        } else {
          // lower is date, extend upper downwards to include it
          const extended = new ManifestEntity({ ...order.upper }).extend(
            'start',
            order.lower,
            findLowestId(items)?.id,
          );
          return {
            discard: [],
            order: new Order({ ...order, upper: extended }),
          };
        }
      } else if (order.lower instanceof ManifestEntity) {
        // upper is date, extend lower upwards to include it
        const extended = new ManifestEntity({ ...order.lower }).extend(
          'end',
          resolveWithDate(findHighestDate(items)!),
          findHighestId(items)?.id,
        );
        return {
          discard: [],
          order: new Order({ ...order, lower: extended }),
        };
      } else if (items.length > 0) {
        // both are dates, create new boundary
        const result = new ManifestEntity({
          type: type,
          lowerId: findLowestId(items)!.id,
          upperId: findHighestId(items)!.id,
          startDate: order.lower,
          endDate: resolveWithDate(findHighestDate(items)!),
        });
        return {
          discard: [],
          order: new Order({ ...order, upper: result }),
        };
      } else {
        // abort without data
        return {
          discard: [],
          order: order,
        };
      }
    }
  }

  /**
   * Calculates availability of data within a date range for given item types.
   * Availability is a number between 0 and 1, where 1 means fully available, and 0 means not available at all.
   * Future data (after currentTime) is considered fully available.
   */
  static computeAvailability(
    manifests: ManifestEntity[],
    range: DateRange,
    types: ItemType[],
    currentTime: Date,
  ): Partial<Record<ItemType, number>> {
    const rangeStart = range.startDate.getTime();
    const rangeEnd = range.endDate.getTime();
    const nowTime = currentTime.getTime();

    const totalDuration = rangeEnd - rangeStart;
    const pastDuration = Math.max(0, Math.min(nowTime, rangeEnd) - rangeStart);
    const futureDuration = totalDuration - pastDuration;

    const availability: Partial<Record<ItemType, number>> = {};

    for (const itemType of types) {
      const filtered = manifests.filter((m) => m.type === itemType);

      if (filtered.length === 0) {
        availability[itemType] = 0;
        continue;
      }

      const orders = this.computeOrders(filtered, range);

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
        // Future data is not real, so assumed available.
        availability[itemType] = 1;
      } else {
        const pastGaps = Math.max(0, totalGaps - futureDuration);
        availability[itemType] = Math.max(0, 1 - pastGaps / pastDuration);
      }
    }

    return availability;
  }

  /**
   * Computes merging of all manifests in the given list that are overlapping or adjacent.
   */
  static computeMergeInRange(manifests: ManifestEntity[]): ManifestRewrite {
    if (manifests.length === 0) {
      return { discard: [], results: [] };
    }

    const sorted = [...manifests].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    const toDiscard: ManifestEntity[] = [];
    const results: ManifestEntity[] = [];

    let i = 0;
    while (i < sorted.length) {
      let current = sorted[i]!;
      let j = i + 1;

      while (j < sorted.length) {
        const next = sorted[j]!;

        if (this.shouldMergeManifests(current, next)) {
          const mergeInstruction = this.computeMerge(current, next);

          toDiscard.push(...mergeInstruction.discard);
          current = mergeInstruction.results[0]!;

          sorted.splice(j, 1);
        } else {
          j++;
        }
      }

      results.push(current);
      i++;
    }

    return {
      discard: toDiscard,
      results: results,
    };
  }
}
