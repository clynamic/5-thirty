import { DateRange } from 'src/common';
import { ItemType } from 'src/label/label.entity';

import { ManifestEntity, Order } from './manifest.entity';
import { ManifestUtils } from './manifest.utils';

describe('ManifestUtils', () => {
  describe('areBoundariesContiguous', () => {
    it('should return true for equal dates', () => {
      const date1 = new Date('2023-01-01T12:00:00Z');
      const date2 = new Date('2023-01-01T12:00:00Z');

      const result = ManifestUtils.areBoundariesContiguous(
        date1,
        date2,
        'end',
        'start',
      );

      expect(result).toBe(true);
    });

    it('should return true for dates 1ms apart', () => {
      const date1 = new Date('2023-01-01T12:00:00.000Z');
      const date2 = new Date('2023-01-01T12:00:00.001Z');

      const result = ManifestUtils.areBoundariesContiguous(
        date1,
        date2,
        'end',
        'start',
      );

      expect(result).toBe(true);
    });

    it('should return false for dates more than 1ms apart', () => {
      const date1 = new Date('2023-01-01T12:00:00.000Z');
      const date2 = new Date('2023-01-01T12:00:00.002Z');

      const result = ManifestUtils.areBoundariesContiguous(
        date1,
        date2,
        'end',
        'start',
      );

      expect(result).toBe(false);
    });

    it('should handle ManifestEntity boundaries with contiguous dates', () => {
      const manifest1 = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        startDate: new Date('2023-01-02'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const result = ManifestUtils.areBoundariesContiguous(
        manifest1,
        manifest2,
        'end',
        'start',
      );

      expect(result).toBe(true);
    });

    it('should handle mixed boundary types', () => {
      const manifest = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-02'),
        type: ItemType.posts,
      });

      const date = new Date('2023-01-02');

      const result = ManifestUtils.areBoundariesContiguous(
        manifest,
        date,
        'end',
        'start',
      );

      expect(result).toBe(true);
    });
  });

  describe('isBoundaryBefore', () => {
    it('should return true when first boundary is before second', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');

      const result = ManifestUtils.isBoundaryBefore(
        date1,
        date2,
        'start',
        'start',
      );

      expect(result).toBe(true);
    });

    it('should return false when first boundary is after second', () => {
      const date1 = new Date('2023-01-02');
      const date2 = new Date('2023-01-01');

      const result = ManifestUtils.isBoundaryBefore(
        date1,
        date2,
        'start',
        'start',
      );

      expect(result).toBe(false);
    });
  });

  describe('computeOrders', () => {
    it('should return single order when no manifests provided', () => {
      const dateRange = new DateRange({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-10'),
      });

      const result = ManifestUtils.computeOrders([], dateRange);

      expect(result).toHaveLength(1);
      expect(result[0]!.lower).toEqual(dateRange.startDate);
      expect(result[0]!.upper).toEqual(dateRange.endDate);
    });

    it('should create orders around single manifest', () => {
      const manifests = [
        new ManifestEntity({
          startDate: new Date('2023-01-03'),
          endDate: new Date('2023-01-05'),
          type: ItemType.posts,
        }),
      ];

      const dateRange = new DateRange({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-10'),
      });

      const result = ManifestUtils.computeOrders(manifests, dateRange);

      expect(result).toHaveLength(2);
      expect(result[0]!.lower).toEqual(dateRange.startDate);
      expect(result[0]!.upper).toEqual(manifests[0]);
      expect(result[1]!.lower).toEqual(manifests[0]);
      expect(result[1]!.upper).toEqual(dateRange.endDate);
    });

    it('should merge contiguous manifests', () => {
      const manifests = [
        new ManifestEntity({
          id: 1,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-03'),
          type: ItemType.posts,
        }),
        new ManifestEntity({
          id: 2,
          startDate: new Date('2023-01-03'),
          endDate: new Date('2023-01-05'),
          type: ItemType.posts,
        }),
      ];

      const dateRange = new DateRange({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-10'),
      });

      const result = ManifestUtils.computeOrders(manifests, dateRange);

      expect(result).toHaveLength(1);
      expect(result[0]!.lower).toEqual(manifests[1]);
      expect(result[0]!.upper).toEqual(dateRange.endDate);
    });
  });

  describe('splitLongOrders', () => {
    it('should not split orders shorter than maxOrderDuration', () => {
      const orders = [
        new Order({
          lower: new Date('2023-01-01'),
          upper: new Date('2023-01-05'),
        }),
      ];

      const result = ManifestUtils.splitLongOrders(orders, 7);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(orders[0]);
    });

    it('should split orders longer than maxOrderDuration', () => {
      const orders = [
        new Order({
          lower: new Date('2023-01-01'),
          upper: new Date('2023-01-20'),
        }),
      ];

      const result = ManifestUtils.splitLongOrders(orders, 7);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0]!.lower).toEqual(orders[0]!.lower);
      expect(result[result.length - 1]!.upper).toEqual(orders[0]!.upper);
    });
  });

  describe('shouldMergeManifests', () => {
    it('should return true for overlapping manifests', () => {
      const manifest1 = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-07'),
        type: ItemType.posts,
      });

      const result = ManifestUtils.shouldMergeManifests(manifest1, manifest2);

      expect(result).toBe(true);
    });

    it('should return true for contiguous manifests', () => {
      const manifest1 = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const result = ManifestUtils.shouldMergeManifests(manifest1, manifest2);

      expect(result).toBe(true);
    });

    it('should return false for separate manifests', () => {
      const manifest1 = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        startDate: new Date('2023-01-05'),
        endDate: new Date('2023-01-07'),
        type: ItemType.posts,
      });

      const result = ManifestUtils.shouldMergeManifests(manifest1, manifest2);

      expect(result).toBe(false);
    });

    it('should return true when one manifest completely contains another', () => {
      const manifest1 = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-10'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const result = ManifestUtils.shouldMergeManifests(manifest1, manifest2);

      expect(result).toBe(true);
    });
  });

  describe('computeMerge', () => {
    it('should keep lower manifest when it has priority', () => {
      const lower = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const upper = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMerge(lower, upper);

      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.id).toBe(1);
      expect(instruction.results[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.discard).toEqual([upper]);
    });

    it('should keep upper manifest when it has priority', () => {
      const lower = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const upper = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMerge(lower, upper);

      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.id).toBe(1);
      expect(instruction.results[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.discard).toEqual([lower]);
    });

    it('should not discard manifest without ID', () => {
      const withId = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const withoutId = new ManifestEntity({
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMerge(withId, withoutId);

      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.id).toBe(1);
      expect(instruction.discard).toEqual([]);
    });
  });

  describe('computeSaveResults', () => {
    const mockItems = [
      { id: 100, updatedAt: new Date('2023-01-01') },
      { id: 200, updatedAt: new Date('2023-01-02') },
      { id: 300, updatedAt: new Date('2023-01-03') },
    ];

    it('should extend existing upper manifest when not exhausted', () => {
      const upperManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-05'),
        endDate: new Date('2023-01-10'),
        type: ItemType.posts,
      });

      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: upperManifest,
      });

      const instruction = ManifestUtils.computeSaveResults(
        ItemType.posts,
        order,
        mockItems,
        false,
      );

      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.order.upper).toBe(instruction.results[0]);
      expect(instruction.order.lower).toBe(order.lower);
    });

    it('should create new manifest when upper is Date and not exhausted', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-01-10'),
      });

      const instruction = ManifestUtils.computeSaveResults(
        ItemType.posts,
        order,
        mockItems,
        false,
      );

      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.type).toBe(ItemType.posts);
      expect(instruction.results[0]!.lowerId).toBe(100);
      expect(instruction.results[0]!.upperId).toBe(300);
      expect(instruction.discard).toEqual([]);
      expect(instruction.order.upper).toBe(instruction.results[0]);
      expect(instruction.order.lower).toBe(order.lower);
    });

    it('should merge manifests when exhausted and both boundaries are manifests', () => {
      const lowerManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const upperManifest = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-05'),
        endDate: new Date('2023-01-10'),
        type: ItemType.posts,
      });

      const order = new Order({
        lower: lowerManifest,
        upper: upperManifest,
      });

      const instruction = ManifestUtils.computeSaveResults(
        ItemType.posts,
        order,
        mockItems,
        true,
      );

      expect(instruction.results).toHaveLength(1);
      expect(instruction.discard).toHaveLength(1);
      expect(instruction.order.lower).toBe(instruction.results[0]);
      expect(instruction.order.upper).toBe(instruction.results[0]);
    });

    it('should return no-op when exhausted with no items', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-01-10'),
      });

      const instruction = ManifestUtils.computeSaveResults(
        ItemType.posts,
        order,
        [],
        true,
      );

      expect(instruction.results).toEqual([]);
      expect(instruction.discard).toEqual([]);
      expect(instruction.order).toBe(order);
    });
  });

  describe('computeAvailability', () => {
    const range = new DateRange({
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-10'),
    });

    it('should return 0 availability when no manifests exist', () => {
      const availability = ManifestUtils.computeAvailability(
        [],
        range,
        [ItemType.posts],
        new Date('2023-01-05'),
      );

      expect(availability[ItemType.posts]).toBe(0);
    });

    it('should return 1 availability when no orders exist (fully covered)', () => {
      const manifests = [
        new ManifestEntity({
          startDate: new Date('2022-12-25'),
          endDate: new Date('2023-01-15'),
          type: ItemType.posts,
        }),
      ];

      const availability = ManifestUtils.computeAvailability(
        manifests,
        range,
        [ItemType.posts],
        new Date('2023-01-05'),
      );

      expect(availability[ItemType.posts]).toBe(1);
    });

    it('should return 1 availability for future ranges', () => {
      const manifests = [
        new ManifestEntity({
          startDate: new Date('2023-01-03'),
          endDate: new Date('2023-01-07'),
          type: ItemType.posts,
        }),
      ];

      const availability = ManifestUtils.computeAvailability(
        manifests,
        range,
        [ItemType.posts],
        new Date('2022-12-31'),
      );

      expect(availability[ItemType.posts]).toBe(1);
    });

    it('should calculate partial availability based on gaps', () => {
      const manifests = [
        new ManifestEntity({
          startDate: new Date('2023-01-03'),
          endDate: new Date('2023-01-05'),
          type: ItemType.posts,
        }),
      ];

      const availability = ManifestUtils.computeAvailability(
        manifests,
        range,
        [ItemType.posts],
        new Date('2023-01-06'),
      );

      expect(availability[ItemType.posts]).toEqual(0.4);
    });

    it('should handle multiple item types separately', () => {
      const manifests = [
        new ManifestEntity({
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-10'),
          type: ItemType.posts,
        }),
        new ManifestEntity({
          startDate: new Date('2023-01-06'),
          endDate: new Date('2023-01-08'),
          type: ItemType.users,
        }),
      ];

      const availability = ManifestUtils.computeAvailability(
        manifests,
        range,
        [ItemType.posts, ItemType.users],
        new Date('2023-01-05'),
      );

      expect(availability[ItemType.posts]).toBe(1);
      expect(availability[ItemType.users]).toBeGreaterThan(0);
      expect(availability[ItemType.users]).toBeLessThan(1);
    });
  });

  describe('computeMergeInRange', () => {
    it('should return empty instruction for no manifests', () => {
      const instruction = ManifestUtils.computeMergeInRange([]);

      expect(instruction.discard).toEqual([]);
      expect(instruction.results).toEqual([]);
    });

    it('should return single manifest unchanged when no merges needed', () => {
      const manifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMergeInRange([manifest]);

      expect(instruction.discard).toEqual([]);
      expect(instruction.results).toEqual([manifest]);
    });

    it('should merge two contiguous manifests', () => {
      const manifest1 = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMergeInRange([
        manifest2,
        manifest1,
      ]); // Test sorting

      expect(instruction.discard).toHaveLength(1);
      expect(instruction.discard).toContain(manifest2); // Only higher ID is discarded
      expect(instruction.results).toHaveLength(1);
      expect(instruction.results[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.results[0]!.endDate).toEqual(new Date('2023-01-05'));
    });

    it('should handle multiple separate groups of merges', () => {
      const group1a = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const group1b = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const group2a = new ManifestEntity({
        id: 3,
        startDate: new Date('2023-01-10'),
        endDate: new Date('2023-01-12'),
        type: ItemType.posts,
      });

      const group2b = new ManifestEntity({
        id: 4,
        startDate: new Date('2023-01-12'),
        endDate: new Date('2023-01-14'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMergeInRange([
        group2b,
        group1a,
        group2a,
        group1b,
      ]);

      expect(instruction.discard).toHaveLength(2);
      expect(instruction.discard).toContain(group1b);
      expect(instruction.discard).toContain(group2b);

      expect(instruction.results).toHaveLength(2);
      expect(instruction.results[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.results[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.results[1]!.startDate).toEqual(new Date('2023-01-10'));
      expect(instruction.results[1]!.endDate).toEqual(new Date('2023-01-14'));
    });
  });
});
