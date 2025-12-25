import { isAfter, isBefore, isEqual, isSameMonth } from 'date-fns';
import {
  DateRange,
  TimeScale,
  assignDateBuckets,
  createTimeBuckets,
  endOf,
  expandInto,
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
  OrderResults,
  OrderSide,
} from './manifest.entity';

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
   * Determines if two manifests are adjacent or overlapping.
   */
  static shouldMergeManifests(
    manifest1: ManifestEntity,
    manifest2: ManifestEntity,
  ): boolean {
    const [first, second] = isBefore(manifest1.startDate, manifest2.startDate)
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
   * Calculate Manifest end date based on order and fetched items.
   */
  private static getTopDate(
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): Date | undefined {
    if (top) {
      return order.upperDate;
    } else {
      const itemDate = resolveWithDate(findHighestDate(items));
      if (!itemDate) {
        return undefined;
      }
      return isAfter(itemDate, order.upperDate) ? order.upperDate : itemDate;
    }
  }

  private static getBottomDate(
    order: Order,
    items: OrderResult[],
    bottom: boolean,
  ): Date | undefined {
    if (bottom) {
      return order.lowerDate;
    } else {
      const itemDate = resolveWithDate(findLowestDate(items));
      if (!itemDate) {
        return undefined;
      }
      return isBefore(itemDate, order.lowerDate) ? order.lowerDate : itemDate;
    }
  }

  private static handleNoItems(order: Order): ManifestOrderRewrite {
    return {
      discard: [],
      save: [],
      order,
    };
  }

  /*

  private static splitIntoMonthlyManifests(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
    bottom: boolean,
  ): ManifestOrderRewrite {
    // Step 1: Bucket items by month
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime()); // Newest first

    // Step 2: Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    // Step 3: Handle boundary merging based on what boundaries exist
    let save: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    const newestManifest = save[0]!;
    const newestBucketDate = bucketDates[0]!;
    const newestBucketItems = buckets[newestBucketDate.getTime()]!;
    newestManifest.endDate = ManifestUtils.getTopDate(
      order,
      newestBucketItems,
      top,
    )!;

    const oldestManifest = save[save.length - 1]!;
    const oldestBucketDate = bucketDates[bucketDates.length - 1]!;
    const oldestBucketItems = buckets[oldestBucketDate.getTime()]!;
    oldestManifest.startDate = ManifestUtils.getBottomDate(
      order,
      oldestBucketItems,
      bottom,
    )!;

    if (order.upper instanceof ManifestEntity) {
      const newestManifest = save[0]!;
      const upperManifest = order.upper;

      if (isSameMonth(newestManifest.startDate, upperManifest.startDate)) {
        const mergeResult = this.computeMerge(newestManifest, upperManifest);
        save = [mergeResult.save[0]!, ...save.slice(1)];
        discard = [...discard, ...mergeResult.discard];
      }
    }

    if (order.lower instanceof ManifestEntity) {
      const oldestManifest = save[save.length - 1]!;
      const lowerManifest = order.lower;

      if (isSameMonth(oldestManifest.startDate, lowerManifest.startDate)) {
        const mergeResult = this.computeMerge(lowerManifest, oldestManifest);
        save = [...save.slice(0, -1), mergeResult.save[0]!];
        discard = [...discard, ...mergeResult.discard];
      }
    }

    // Step 4: Determine final boundaries
    let newLower: ManifestEntity | Date = order.lower;
    let newUpper: ManifestEntity | Date = order.upper;

    const bothBoundariesExist =
      order.upper instanceof ManifestEntity &&
      order.lower instanceof ManifestEntity;

    if (bothBoundariesExist) {
      newUpper = save.shift()!;
      newLower = save.length > 0 ? save.pop()! : newUpper;
    } else if (save.length > 0) {
      newUpper = save.pop()!;

      if (bottom) {
        newLower = newUpper;
      }
    }

    return {
      discard,
      save,
      order: new Order({ lower: newLower, upper: newUpper }),
    };
  }
  */

  private static handleExtendExistingUpper(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const upperManifest = order.upper as ManifestEntity;
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    let save: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    // Merge newest manifest with existing upper boundary if same month
    const newestManifest = save[0]!;

    if (isSameMonth(newestManifest.startDate, upperManifest.startDate)) {
      const mergeResult = this.computeMerge(newestManifest, upperManifest);
      save = [mergeResult.save[0]!, ...save.slice(1)];
      discard = [...discard, ...mergeResult.discard];
    }

    // Pop oldest to become new upper boundary and adjust startDate
    const newUpperManifest = save.pop()!;
    const lowerBucketDate = bucketDates.find((d) =>
      isSameMonth(d, newUpperManifest.startDate),
    )!;
    const lowerBucketItems = buckets[lowerBucketDate.getTime()]!;
    newUpperManifest.startDate = ManifestUtils.getBottomDate(
      order,
      lowerBucketItems,
      false,
    )!;

    return {
      discard,
      save,
      order: new Order({ lower: order.lower, upper: newUpperManifest }),
    };
  }

  private static handleCreateNewUpper(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    const save: ManifestEntity[] = allManifests;
    const discard: ManifestEntity[] = [];

    // Adjust newest manifest's endDate based on top flag
    const newestManifest = save[0]!;
    const newestBucketDate = bucketDates[0]!;
    const newestBucketItems = buckets[newestBucketDate.getTime()]!;
    newestManifest.endDate = ManifestUtils.getTopDate(
      order,
      newestBucketItems,
      top,
    )!;

    // Pop oldest to become new upper boundary and adjust startDate
    const newUpperManifest = save.pop()!;
    const lowerBucketDate = bucketDates.find((d) =>
      isSameMonth(d, newUpperManifest.startDate),
    )!;
    const lowerBucketItems = buckets[lowerBucketDate.getTime()]!;
    newUpperManifest.startDate = ManifestUtils.getBottomDate(
      order,
      lowerBucketItems,
      false,
    )!;

    return {
      discard,
      save,
      order: new Order({ lower: order.lower, upper: newUpperManifest }),
    };
  }

  private static handleExhaustedMergeBoundaries(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const upperManifest = order.upper as ManifestEntity;
    const lowerManifest = order.lower as ManifestEntity;
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    let save: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    // Merge newest manifest with upper boundary if same month
    const newestManifest = save[0]!;

    if (isSameMonth(newestManifest.startDate, upperManifest.startDate)) {
      const mergeResult = this.computeMerge(newestManifest, upperManifest);
      save = [mergeResult.save[0]!, ...save.slice(1)];
      discard = [...discard, ...mergeResult.discard];
    }

    // Merge oldest manifest with lower boundary if same month
    const oldestManifest = save[save.length - 1]!;

    if (isSameMonth(oldestManifest.startDate, lowerManifest.startDate)) {
      const mergeResult = this.computeMerge(lowerManifest, oldestManifest);
      save = [...save.slice(0, -1), mergeResult.save[0]!];
      discard = [...discard, ...mergeResult.discard];
    }

    // Shift newest to become new upper boundary (merged manifest already has correct dates)
    const newUpperManifest = save.shift()!;

    // Pop oldest to become new lower boundary (merged manifest already has correct dates)
    const newLowerManifest = save.length > 0 ? save.pop()! : newUpperManifest;

    return {
      discard,
      save,
      order: new Order({ lower: newLowerManifest, upper: newUpperManifest }),
    };
  }

  private static handleExhaustedExtendUpperToDateBoundary(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    let save: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    // Merge newest manifest with upper boundary if same month
    if (order.upper instanceof ManifestEntity) {
      const upperManifest = order.upper;
      const newestManifest = save[0]!;

      if (isSameMonth(newestManifest.startDate, upperManifest.startDate)) {
        const mergeResult = this.computeMerge(newestManifest, upperManifest);
        save = [mergeResult.save[0]!, ...save.slice(1)];
        discard = [...discard, ...mergeResult.discard];
      }
    }

    // Pop oldest to become new lower boundary and adjust startDate to order.lower
    const newUpperManifest = save.pop()!;
    const lowerBucketDate = bucketDates[bucketDates.length - 1]!;
    const lowerBucketItems = buckets[lowerBucketDate.getTime()]!;
    newUpperManifest.startDate = ManifestUtils.getBottomDate(
      order,
      lowerBucketItems,
      true,
    )!;

    return {
      discard,
      save,
      order: new Order({ lower: newUpperManifest, upper: order.upper }),
    };
  }

  private static handleExhaustedExtendLowerToDateBoundary(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const lowerManifest = order.lower as ManifestEntity;
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    let save: ManifestEntity[] = allManifests;
    let discard: ManifestEntity[] = [];

    // Merge oldest manifest with lower boundary if same month
    const oldestManifest = save[save.length - 1]!;

    if (isSameMonth(oldestManifest.startDate, lowerManifest.startDate)) {
      const mergeResult = this.computeMerge(lowerManifest, oldestManifest);
      save = [...save.slice(0, -1), mergeResult.save[0]!];
      discard = [...discard, ...mergeResult.discard];
    }

    // Pop oldest to become new lower boundary (already has correct dates from merge)
    const newUpperManifest = save.pop()!;

    return {
      discard,
      save,
      order: new Order({ lower: newUpperManifest, upper: order.upper }),
    };
  }

  private static handleExhaustedCreateBoundary(
    type: ItemType,
    order: Order,
    items: OrderResult[],
    top: boolean,
  ): ManifestOrderRewrite {
    const oldestDate = findLowestDate(items)!;
    const newestDate = findHighestDate(items)!;

    // Bucket items by month to create month-bounded manifests
    const buckets = this.createMonthlyBucketsWithItems(
      items,
      resolveWithDate(oldestDate),
      resolveWithDate(newestDate),
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    // Create manifests with full month boundaries for each bucket
    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const bucketItems = buckets[bucketDate.getTime()]!;

      if (bucketItems.length > 0) {
        const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
        const manifest = new ManifestEntity({
          type: type,
          lowerId: findLowestId(bucketItems)!.id,
          upperId: findHighestId(bucketItems)!.id,
          startDate,
          endDate,
        });
        allManifests.push(manifest);
      }
    }

    const save: ManifestEntity[] = allManifests;
    const discard: ManifestEntity[] = [];

    // Adjust newest manifest's endDate based on top flag
    const newestManifest = save[0]!;
    const newestBucketDate = bucketDates[0]!;
    const newestBucketItems = buckets[newestBucketDate.getTime()]!;
    newestManifest.endDate = ManifestUtils.getTopDate(
      order,
      newestBucketItems,
      top,
    )!;

    // Pop oldest to become new lower boundary and adjust startDate
    const newUpperManifest = save.pop()!;
    const lowerBucketDate = bucketDates[bucketDates.length - 1]!;
    const lowerBucketItems = buckets[lowerBucketDate.getTime()]!;
    newUpperManifest.startDate = ManifestUtils.getBottomDate(
      order,
      lowerBucketItems,
      true,
    )!;

    return {
      discard,
      save,
      order: new Order({ lower: newUpperManifest, upper: order.upper }),
    };
  }

  private static handleExhaustedCreateEmptyBoundary(
    type: ItemType,
    order: Order,
  ): ManifestOrderRewrite {
    const lowerDate = order.lower as Date;
    const upperDate = order.upperDate;

    const buckets = this.createMonthlyBucketsWithItems(
      [],
      lowerDate,
      upperDate,
    );

    const bucketDates = Object.keys(buckets)
      .map((k) => new Date(+k))
      .sort((a, b) => b.getTime() - a.getTime());

    const allManifests: ManifestEntity[] = [];

    for (const bucketDate of bucketDates) {
      const { startDate, endDate } = expandInto(bucketDate, TimeScale.Month);
      const manifest = new ManifestEntity({
        type: type,
        startDate,
        endDate,
      });
      allManifests.push(manifest);
    }

    const save: ManifestEntity[] = allManifests;

    const newUpperManifest = save.pop()!;
    newUpperManifest.startDate = lowerDate;

    if (save.length > 0) {
      save[0]!.endDate = upperDate;
    } else {
      newUpperManifest.endDate = upperDate;
    }

    return {
      discard: [],
      save,
      order: new Order({ lower: order.lower, upper: newUpperManifest }),
    };
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

    if (!bottom) {
      if (items.length === 0) {
        return this.handleNoItems(order);
      }

      if (order.upper instanceof ManifestEntity) {
        return this.handleExtendExistingUpper(type, order, items, top);
      } else {
        return this.handleCreateNewUpper(type, order, items, top);
      }
    } else {
      if (order.upper instanceof ManifestEntity) {
        if (order.lower instanceof ManifestEntity) {
          return this.handleExhaustedMergeBoundaries(type, order, items, top);
        } else {
          return this.handleExhaustedExtendUpperToDateBoundary(
            type,
            order,
            items,
            top,
          );
        }
      } else if (order.lower instanceof ManifestEntity) {
        return this.handleExhaustedExtendLowerToDateBoundary(
          type,
          order,
          items,
          top,
        );
      } else {
        if (items.length > 0) {
          return this.handleExhaustedCreateBoundary(type, order, items, top);
        } else {
          return this.handleExhaustedCreateEmptyBoundary(type, order);
        }
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

  static createMonthlyBucketsWithItems(
    items: OrderResult[],
    startDate: Date,
    endDate: Date,
  ): Record<number, OrderResult[]> {
    // For monthly buckets, we need to start from the beginning of the first month
    // and end at the end of the last month to ensure all items are covered
    const monthStartDate = startOf(TimeScale.Month, startDate);
    const monthEndDate = endOf(TimeScale.Month, endDate);

    const dateRange = new DateRange({
      startDate: monthStartDate,
      endDate: monthEndDate,
      scale: TimeScale.Month,
      timezone: 'UTC',
    });

    const buckets = createTimeBuckets(dateRange);

    const datePoints = items.map((item) => resolveWithDate(item));

    const assignments = assignDateBuckets(datePoints, buckets, items);

    return assignments;
  }
}
