import { add, isAfter, isBefore, isEqual } from 'date-fns';
import {
  DateRange,
  TimeScale,
  assignDateBuckets,
  createTimeBuckets,
  expandInto,
  findHighestDate,
  findHighestId,
  findLowestDate,
  findLowestId,
  isSameOf,
  resolveWithDate,
  scaleToDuration,
  startOf,
} from 'src/common';
import { ItemType } from 'src/label/label.entity';

import {
  ManifestEntity,
  Order,
  OrderBoundary,
  OrderResult,
  OrderResults,
  OrderSide,
} from './manifest.entity';

export const MANIFEST_SPLIT_TIMESCALE = TimeScale.Month;

export interface ManifestRewrite {
  /**
   * Input manifests that should be removed from storage.
   * May not contain manifests which are in save.
   */
  discard: ManifestEntity[];
  /**
   * New manifests that should be saved to storage.
   * May not contain manifests which are in discard.
   */
  save: ManifestEntity[];
}

export type ManifestOrderRewrite = ManifestRewrite & {
  /**
   * Updated order with new boundaries.
   * May not contain manifests which are inside discard or save.
   */
  order: Order;
};

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

    return isEqual(date1, date2);
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
    return isBefore(
      Order.getBoundaryDate(boundary1, side1),
      Order.getBoundaryDate(boundary2, side2),
    );
  }

  /**
   * Calculates orders (gaps) between manifests within a date range.
   */
  static computeOrders(
    manifests: ManifestEntity[],
    dateRange: DateRange,
  ): Order[] {
    const sorted = [...manifests].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    const orders: Order[] = [];
    let boundary: OrderBoundary = dateRange.startDate;

    for (const manifest of sorted) {
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

    const boundaryEnd = Order.getBoundaryDate(boundary, 'end');
    if (isBefore(boundaryEnd, dateRange.endDate)) {
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
      const durationMs = upperDate.getTime() - lowerDate.getTime();
      const maxDurationMs = maxOrderDuration * 24 * 60 * 60 * 1000; // days to milliseconds

      if (durationMs <= maxDurationMs) {
        // Order is within duration limit, keep as is
        splitOrders.push(order);
      } else {
        // Split order into segments of maxOrderDuration
        let currentStart = lowerDate;
        const originalLowerBoundary = order.lower;
        const originalUpperBoundary = order.upper;

        while (isBefore(currentStart, upperDate)) {
          const remainingMs = upperDate.getTime() - currentStart.getTime();
          const segmentMs = Math.min(maxDurationMs, remainingMs);
          const currentEnd = new Date(currentStart.getTime() + segmentMs);

          if (isEqual(currentStart, lowerDate)) {
            // First segment uses original lower boundary
            splitOrders.push(
              new Order({
                lower: originalLowerBoundary,
                upper: currentEnd,
              }),
            );
          } else if (isEqual(currentEnd, upperDate)) {
            // Last segment uses original upper boundary
            splitOrders.push(
              new Order({
                lower: currentStart,
                upper: originalUpperBoundary,
              }),
            );
          } else {
            // Middle segment uses dates
            splitOrders.push(
              new Order({
                lower: currentStart,
                upper: currentEnd,
              }),
            );
          }

          currentStart = currentEnd;
        }
      }
    }

    return splitOrders;
  }

  /**
   * Determines if two manifests are adjacent or overlapping and in the same time bucket.
   */
  static shouldMergeManifests(
    manifest1: ManifestEntity,
    manifest2: ManifestEntity,
  ): boolean {
    const [first, second] = isBefore(manifest1.startDate, manifest2.startDate)
      ? [manifest1, manifest2]
      : [manifest2, manifest1];

    if (
      !isSameOf(MANIFEST_SPLIT_TIMESCALE, first.startDate, second.startDate)
    ) {
      return false;
    }

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
        save: [result],
      };
    } else if (!upper.id || (lower.id && lower.id < upper.id)) {
      // Keep lower: either upper has no ID, or lower has a smaller ID
      const result = new ManifestEntity({ ...lower });
      result.extendWith(upper, 'end');
      return {
        discard: upper.id ? [upper] : [],
        save: [result],
      };
    } else {
      // Keep upper: upper has a smaller ID than lower (or lower has no ID)
      const result = new ManifestEntity({ ...upper });
      result.extendWith(lower, 'start');
      return {
        discard: lower.id ? [lower] : [], // Don't discard if lower has no ID
        save: [result],
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
  static computeSaveResults(save: OrderResults): ManifestOrderRewrite {
    const { type, order, items, bottom, top } = save;

    if (!bottom && items.length === 0) {
      return { discard: [], save: [], order };
    }

    const oldestDate =
      (bottom ? null : resolveWithDate(findLowestDate(items))) ??
      order.lowerDate;
    const newestDate =
      resolveWithDate(findHighestDate(items)) ?? order.upperDate;
    const buckets = this.createBucketsWithItems(
      items,
      oldestDate,
      newestDate,
      MANIFEST_SPLIT_TIMESCALE,
    );
    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    const allManifests: ManifestEntity[] = [];
    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;
      const { startDate, endDate } = expandInto(
        bucketDate,
        MANIFEST_SPLIT_TIMESCALE,
      );
      const manifest = new ManifestEntity({
        type,
        lowerId: findLowestId(bucketItems)?.id,
        upperId: findHighestId(bucketItems)?.id,
        startDate,
        endDate,
      });
      allManifests.push(manifest);
    }

    let saveManifests: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    if (order.upper instanceof ManifestEntity) {
      const newestManifest = saveManifests[0]!;
      const upperManifest = order.upper;

      if (
        isSameOf(
          MANIFEST_SPLIT_TIMESCALE,
          newestManifest.startDate,
          upperManifest.startDate,
        )
      ) {
        const mergeResult = this.computeMerge(newestManifest, upperManifest);
        saveManifests = [mergeResult.save[0]!, ...saveManifests.slice(1)];
        discard = [...discard, ...mergeResult.discard];
      }
    }

    if (!(order.upper instanceof ManifestEntity)) {
      const newestManifest = saveManifests[0]!;
      const newestBucketDate = bucketDates[0]!;
      const newestBucketItems = buckets[newestBucketDate.getTime()]!;

      if (top) {
        newestManifest.endDate = order.upperDate;
      } else {
        const itemDate = resolveWithDate(findHighestDate(newestBucketItems));
        newestManifest.endDate = itemDate
          ? isAfter(itemDate, order.upperDate)
            ? order.upperDate
            : itemDate
          : order.upperDate;
      }
    }

    if (order.lower instanceof ManifestEntity && bottom) {
      const oldestManifest = saveManifests[saveManifests.length - 1]!;
      const lowerManifest = order.lower;

      if (
        isSameOf(
          MANIFEST_SPLIT_TIMESCALE,
          oldestManifest.startDate,
          lowerManifest.startDate,
        )
      ) {
        const mergeResult = this.computeMerge(lowerManifest, oldestManifest);
        saveManifests = [...saveManifests.slice(0, -1), mergeResult.save[0]!];
        discard = [...discard, ...mergeResult.discard];
      }
    }

    const promotedManifest = saveManifests.pop()!;

    if (!(order.lower instanceof ManifestEntity && bottom)) {
      const oldestBucketDate = bucketDates[bucketDates.length - 1]!;
      const oldestBucketItems = buckets[oldestBucketDate.getTime()]!;

      if (bottom) {
        promotedManifest.startDate = order.lowerDate;
      } else {
        const itemDate = resolveWithDate(findLowestDate(oldestBucketItems));
        promotedManifest.startDate = itemDate
          ? isBefore(itemDate, order.lowerDate)
            ? order.lowerDate
            : itemDate
          : order.lowerDate;
      }
    }

    const newUpper = promotedManifest;
    const newLower = bottom ? newUpper.startDate : order.lower;

    return {
      discard,
      save: saveManifests,
      order: new Order({ lower: newLower, upper: newUpper }),
    };
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
      return { discard: [], save: [] };
    }

    const sorted = [...manifests].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    const discard: ManifestEntity[] = [];
    const save: ManifestEntity[] = [];

    let current = sorted[0]!;

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]!;

      if (this.shouldMergeManifests(current, next)) {
        const mergeInstruction = this.computeMerge(current, next);
        discard.push(...(mergeInstruction.discard ?? []));
        current = mergeInstruction.save![0]!;
      } else {
        // No merge possible, finalize current and move to next
        save.push(current);
        current = next;
      }
    }

    // Add the final current manifest
    save.push(current);

    return {
      discard,
      save,
    };
  }

  static createBucketsWithItems(
    items: OrderResult[],
    startDate: Date,
    endDate: Date,
    scale: TimeScale,
  ): Record<number, OrderResult[]> {
    const scaleStartDate = startOf(scale, startDate);
    const scaleEndDate = add(startOf(scale, endDate), {
      [scaleToDuration(scale)]: 1,
    });

    const dateRange = new DateRange({
      startDate: scaleStartDate,
      endDate: scaleEndDate,
      scale,
      timezone: 'UTC',
    });

    const buckets = createTimeBuckets(dateRange);

    const datePoints = items.map((item) => resolveWithDate(item));

    const assignments = assignDateBuckets(datePoints, buckets, items);

    return assignments;
  }
}
