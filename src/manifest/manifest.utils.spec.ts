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

    it('should return false for dates 1ms apart', () => {
      const date1 = new Date('2023-01-01T12:00:00.000Z');
      const date2 = new Date('2023-01-01T12:00:00.001Z');

      const result = ManifestUtils.areBoundariesContiguous(
        date1,
        date2,
        'end',
        'start',
      );

      expect(result).toBe(false);
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

    it('should not create trailing order when last manifest ends exactly at range end', () => {
      const manifests = [
        new ManifestEntity({
          id: 1,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-10'),
          type: ItemType.posts,
        }),
      ];

      const dateRange = new DateRange({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-10'),
      });

      const result = ManifestUtils.computeOrders(manifests, dateRange);

      expect(result).toHaveLength(0);
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

    it('should maintain order invariants after splitting', () => {
      const orders = [
        new Order({
          lower: new Date('2023-01-01'),
          upper: new Date('2023-01-30'),
        }),
      ];

      const result = ManifestUtils.splitLongOrders(orders, 10);

      // All orders should be <= maxOrderDuration
      for (const order of result) {
        const durationMs =
          order.upperDate.getTime() - order.lowerDate.getTime();
        const maxDurationMs = 10 * 24 * 60 * 60 * 1000;
        expect(durationMs).toBeLessThanOrEqual(maxDurationMs);
      }

      // Union of segments should equal original order
      expect(result[0]!.lowerDate).toEqual(orders[0]!.lowerDate);
      expect(result[result.length - 1]!.upperDate).toEqual(
        orders[0]!.upperDate,
      );

      // Segments should be contiguous
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i]!.upperDate.getTime()).toEqual(
          result[i + 1]!.lowerDate.getTime(),
        );
      }
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
    it('should keep lower manifest when it has lower ID', () => {
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

      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(1);
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.discard).toEqual([upper]);
    });

    it('should keep upper manifest when it has lower ID', () => {
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

      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(1);
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.discard).toEqual([lower]);
    });

    it('should extend in place when manifests have same ID (no discard)', () => {
      const lower = new ManifestEntity({
        id: 5,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const upper = new ManifestEntity({
        id: 5,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMerge(lower, upper);

      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(5);
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.discard).toEqual([]);
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

      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(1);
      expect(instruction.discard).toEqual([]);
    });

    it('should keep upper manifest and extend when lower has no ID', () => {
      const withoutId = new ManifestEntity({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-03'),
        type: ItemType.posts,
      });

      const withId = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMerge(withoutId, withId);

      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(1); // Keeps the ID from withId
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01')); // Extended to cover withoutId
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.discard).toEqual([]); // Don't discard the manifest without ID
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

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: mockItems,
        bottom: false,
        top: false,
      });

      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const extendedUpper = instruction.order.upper as ManifestEntity;
      expect(extendedUpper.startDate).toEqual(new Date('2023-01-01'));
      expect(extendedUpper.endDate).toEqual(new Date('2023-01-10'));
      expect(instruction.order.lower).toBe(order.lower);
      expect(instruction.discard).toEqual([]);
    });

    it('should split into monthly manifests when extending upper across month boundaries', () => {
      const upperManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-03-15'),
        endDate: new Date('2023-04-01'),
        type: ItemType.posts,
        lowerId: 400,
        upperId: 500,
      });

      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: upperManifest,
      });

      const itemsAcrossMonths = [
        { id: 300, updatedAt: new Date('2023-03-05') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 100, updatedAt: new Date('2023-01-15') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: false,
        top: false,
      });

      // Should not discard anything (extending in place)
      expect(instruction.discard).toEqual([]);

      // Should save February (complete month) and merged March
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      // Merged March manifest (extended backward to include new item)
      const marchManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 2,
      );
      expect(marchManifest).toBeDefined();
      expect(marchManifest!.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest!.endDate).toEqual(new Date('2023-04-01'));
      expect(marchManifest!.lowerId).toBe(300);
      expect(marchManifest!.upperId).toBe(500);

      // February manifest (complete month)
      const febManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 1,
      );
      expect(febManifest).toBeDefined();
      expect(febManifest!.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest!.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest!.lowerId).toBe(200);
      expect(febManifest!.upperId).toBe(200);

      // January manifest becomes new upper boundary (not exhausted, uses actual item date)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.startDate).toEqual(new Date('2023-01-15'));
      expect(newUpper.endDate).toEqual(new Date('2023-02-01'));
      expect(newUpper.lowerId).toBe(100);
      expect(newUpper.upperId).toBe(100);
    });

    it('should split into monthly manifests when creating new upper across month boundaries', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-04-01'),
      });

      const itemsAcrossMonths = [
        { id: 300, updatedAt: new Date('2023-03-20') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 100, updatedAt: new Date('2023-01-15') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: false,
        top: false,
      });

      // Should not discard anything (no existing manifest)
      expect(instruction.discard).toEqual([]);

      // Should save March and February (complete months)
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      // March manifest (newest, uses actual item date since top=false)
      const marchManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 2,
      );
      expect(marchManifest).toBeDefined();
      expect(marchManifest!.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest!.endDate).toEqual(new Date('2023-03-20'));
      expect(marchManifest!.lowerId).toBe(300);
      expect(marchManifest!.upperId).toBe(300);

      // February manifest (complete month)
      const febManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 1,
      );
      expect(febManifest).toBeDefined();
      expect(febManifest!.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest!.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest!.lowerId).toBe(200);
      expect(febManifest!.upperId).toBe(200);

      // January manifest becomes new upper boundary (not exhausted, uses actual item date)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.startDate).toEqual(new Date('2023-01-15'));
      expect(newUpper.endDate).toEqual(new Date('2023-02-01'));
      expect(newUpper.lowerId).toBe(100);
      expect(newUpper.upperId).toBe(100);
    });

    it('should create new manifest when upper is Date and not exhausted', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-01-10'),
      });

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: mockItems,
        bottom: false,
        top: false,
      });

      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.type).toBe(ItemType.posts);
      expect(newUpper.lowerId).toBe(100);
      expect(newUpper.upperId).toBe(300);
      expect(instruction.discard).toEqual([]);
      expect(instruction.order.lower).toBe(order.lower);
    });

    it('should split into monthly manifests when exhausted and extending upper to date boundary', () => {
      const upperManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-03-15'),
        endDate: new Date('2023-04-01'),
        type: ItemType.posts,
        lowerId: 400,
        upperId: 500,
      });

      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: upperManifest,
      });

      const itemsAcrossMonths = [
        { id: 300, updatedAt: new Date('2023-03-05') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 100, updatedAt: new Date('2023-01-15') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: true,
        top: false,
      });

      // Should not discard anything
      expect(instruction.discard).toEqual([]);

      // Should save February and merged March
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      // Merged March manifest
      const marchManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 2,
      );
      expect(marchManifest).toBeDefined();
      expect(marchManifest!.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest!.endDate).toEqual(new Date('2023-04-01'));
      expect(marchManifest!.lowerId).toBe(300);
      expect(marchManifest!.upperId).toBe(500);

      // February manifest
      const febManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 1,
      );
      expect(febManifest).toBeDefined();
      expect(febManifest!.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest!.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest!.lowerId).toBe(200);
      expect(febManifest!.upperId).toBe(200);

      // January manifest becomes new upper boundary (promoted)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.startDate).toEqual(new Date('2023-01-01'));
      expect(newUpper.endDate).toEqual(new Date('2023-02-01'));
      expect(newUpper.lowerId).toBe(100);
      expect(newUpper.upperId).toBe(100);

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-01'));
    });

    it('should split into monthly manifests when exhausted and merging both boundaries', () => {
      const lowerManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-15'),
        type: ItemType.posts,
        lowerId: 50,
        upperId: 100,
      });

      const upperManifest = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-03-15'),
        endDate: new Date('2023-04-01'),
        type: ItemType.posts,
        lowerId: 400,
        upperId: 500,
      });

      const order = new Order({
        lower: lowerManifest,
        upper: upperManifest,
      });

      const itemsAcrossMonths = [
        { id: 150, updatedAt: new Date('2023-01-20') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 300, updatedAt: new Date('2023-03-05') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: true,
        top: true,
      });

      expect(instruction.discard).toEqual([]);
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      const marchManifest = instruction.save![0]!;
      expect(marchManifest.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest.endDate).toEqual(new Date('2023-04-01'));
      expect(marchManifest.lowerId).toBe(300);
      expect(marchManifest.upperId).toBe(500);

      const febManifest = instruction.save![1]!;
      expect(febManifest.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest.lowerId).toBe(200);
      expect(febManifest.upperId).toBe(200);

      // Merged January becomes upper boundary (promoted)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const upperBoundary = instruction.order.upper as ManifestEntity;
      expect(upperBoundary.startDate).toEqual(new Date('2023-01-01'));
      expect(upperBoundary.endDate).toEqual(new Date('2023-02-01'));
      expect(upperBoundary.lowerId).toBe(50);
      expect(upperBoundary.upperId).toBe(150);

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-01'));
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

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: mockItems,
        bottom: true,
        top: false,
      });

      expect(instruction.discard).toHaveLength(1);
      expect(instruction.discard[0]!.id).toBe(2);

      // Merged manifest becomes upper boundary (promoted)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const mergedManifest = instruction.order.upper as ManifestEntity;
      expect(mergedManifest.id).toBe(1);

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(mergedManifest.startDate);
    });

    it('should create empty manifest when exhausted with no items', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-01-10'),
      });

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: [],
        bottom: true,
        top: false,
      });

      expect(instruction.discard).toEqual([]);
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const manifest = instruction.order.upper as ManifestEntity;
      expect(manifest.type).toBe(ItemType.posts);
      expect(manifest.startDate).toEqual(new Date('2023-01-01'));
      expect(manifest.endDate).toEqual(new Date('2023-01-10'));

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-01'));
    });

    it('should split into monthly manifests when exhausted with no items across month boundaries', () => {
      const order = new Order({
        lower: new Date('2023-01-15'),
        upper: new Date('2023-04-20'),
      });

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: [],
        bottom: true,
        top: false,
      });

      expect(instruction.discard).toEqual([]);
      expect(instruction.save.length).toBe(3);
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);

      const upperManifest = instruction.order.upper as ManifestEntity;
      expect(upperManifest.startDate).toEqual(new Date('2023-01-15'));
      expect(upperManifest.endDate).toEqual(
        new Date('2023-02-01T00:00:00.000Z'),
      );

      const febManifest = instruction.save[2]!;
      expect(febManifest.startDate).toEqual(
        new Date('2023-02-01T00:00:00.000Z'),
      );
      expect(febManifest.endDate).toEqual(new Date('2023-03-01T00:00:00.000Z'));

      const marchManifest = instruction.save[1]!;
      expect(marchManifest.startDate).toEqual(
        new Date('2023-03-01T00:00:00.000Z'),
      );
      expect(marchManifest.endDate).toEqual(
        new Date('2023-04-01T00:00:00.000Z'),
      );

      const aprilManifest = instruction.save[0]!;
      expect(aprilManifest.startDate).toEqual(
        new Date('2023-04-01T00:00:00.000Z'),
      );
      expect(aprilManifest.endDate).toEqual(new Date('2023-04-20'));

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-15'));
    });

    it('should return no-op when not exhausted with no items', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-01-10'),
      });

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: [],
        bottom: false,
        top: false,
      });

      expect(instruction.discard).toEqual([]);
      expect(instruction.order).toBe(order);
    });

    it('should extend manifest upwards with new items when exhausted', () => {
      const existingManifest = new ManifestEntity({
        id: 1,
        type: ItemType.posts,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-15'),
        lowerId: 100,
        upperId: 200,
      });

      const order = new Order({
        lower: existingManifest,
        upper: new Date('2023-01-31'),
      });

      const newItems = [
        { id: 250, updatedAt: new Date('2023-01-16') },
        { id: 275, updatedAt: new Date('2023-01-17') },
        { id: 300, updatedAt: new Date('2023-01-20') },
      ];

      const result = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: newItems,
        bottom: true,
        top: false,
      });

      // Merged manifest becomes upper boundary (promoted)
      expect(result.order.upper).toBeInstanceOf(ManifestEntity);
      const extendedManifest = result.order.upper as ManifestEntity;

      expect(extendedManifest.upperId).toBe(300);
      expect(extendedManifest.lowerId).toBe(100);
      expect(extendedManifest.id).toBe(1);
      expect(extendedManifest.endDate.getTime()).toBeGreaterThan(
        existingManifest.endDate.getTime(),
      );

      // Lower boundary is Date (promotion principle)
      expect(result.order.lower).toBeInstanceOf(Date);
      expect(result.order.lower).toEqual(new Date('2023-01-01'));
    });

    it('should split into monthly manifests when exhausted and extending lower across month boundaries', () => {
      const lowerManifest = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-15'),
        type: ItemType.posts,
        lowerId: 50,
        upperId: 100,
      });

      const order = new Order({
        lower: lowerManifest,
        upper: new Date('2023-04-01'),
      });

      const itemsAcrossMonths = [
        { id: 150, updatedAt: new Date('2023-01-20') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 300, updatedAt: new Date('2023-03-05') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: true,
        top: false,
      });

      // Should not discard anything
      expect(instruction.discard).toEqual([]);

      // Should save February and March (complete months)
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      // February manifest (complete month)
      const febManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 1,
      );
      expect(febManifest).toBeDefined();
      expect(febManifest!.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest!.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest!.lowerId).toBe(200);
      expect(febManifest!.upperId).toBe(200);

      // March manifest (NOT complete month - top=false means use item date)
      const marchManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 2,
      );
      expect(marchManifest).toBeDefined();
      expect(marchManifest!.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest!.endDate).toEqual(new Date('2023-03-05')); // Last item date, not month boundary
      expect(marchManifest!.lowerId).toBe(300);
      expect(marchManifest!.upperId).toBe(300);

      // Merged January becomes upper boundary (promoted)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.startDate).toEqual(new Date('2023-01-01'));
      expect(newUpper.endDate).toEqual(new Date('2023-02-01'));
      expect(newUpper.lowerId).toBe(50);
      expect(newUpper.upperId).toBe(150);

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-01'));
    });

    it('should split into monthly manifests when exhausted and creating boundary across month boundaries', () => {
      const order = new Order({
        lower: new Date('2023-01-01'),
        upper: new Date('2023-04-01'),
      });

      const itemsAcrossMonths = [
        { id: 300, updatedAt: new Date('2023-03-05') },
        { id: 200, updatedAt: new Date('2023-02-10') },
        { id: 100, updatedAt: new Date('2023-01-15') },
      ];

      const instruction = ManifestUtils.computeSaveResults({
        type: ItemType.posts,
        order,
        items: itemsAcrossMonths,
        bottom: true,
        top: false,
      });

      expect(instruction.discard).toEqual([]);
      expect(instruction.save).toBeDefined();
      expect(instruction.save!.length).toBe(2);

      // March manifest (newest, uses item date since top=false)
      const marchManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 2,
      );
      expect(marchManifest).toBeDefined();
      expect(marchManifest!.startDate).toEqual(new Date('2023-03-01'));
      expect(marchManifest!.endDate).toEqual(new Date('2023-03-05'));
      expect(marchManifest!.lowerId).toBe(300);
      expect(marchManifest!.upperId).toBe(300);

      // February manifest
      const febManifest = instruction.save!.find(
        (m) => m.startDate.getMonth() === 1,
      );
      expect(febManifest).toBeDefined();
      expect(febManifest!.startDate).toEqual(new Date('2023-02-01'));
      expect(febManifest!.endDate).toEqual(new Date('2023-03-01'));
      expect(febManifest!.lowerId).toBe(200);
      expect(febManifest!.upperId).toBe(200);

      // January manifest becomes new upper boundary (promoted)
      expect(instruction.order.upper).toBeInstanceOf(ManifestEntity);
      const newUpper = instruction.order.upper as ManifestEntity;
      expect(newUpper.startDate).toEqual(new Date('2023-01-01'));
      expect(newUpper.endDate).toEqual(new Date('2023-02-01'));
      expect(newUpper.lowerId).toBe(100);
      expect(newUpper.upperId).toBe(100);

      // Lower boundary is Date (promotion principle)
      expect(instruction.order.lower).toBeInstanceOf(Date);
      expect(instruction.order.lower).toEqual(new Date('2023-01-01'));
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
      expect(instruction.save).toEqual([]);
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
      expect(instruction.save).toEqual([manifest]);
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
      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-05'));
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

      expect(instruction.save).toHaveLength(2);
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-05'));
      expect(instruction.save[1]!.startDate).toEqual(new Date('2023-01-10'));
      expect(instruction.save[1]!.endDate).toEqual(new Date('2023-01-14'));
    });

    it('should handle multiple overlapping intervals', () => {
      const manifest1 = new ManifestEntity({
        id: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-05'),
        type: ItemType.posts,
      });

      const manifest2 = new ManifestEntity({
        id: 2,
        startDate: new Date('2023-01-03'),
        endDate: new Date('2023-01-07'),
        type: ItemType.posts,
      });

      const manifest3 = new ManifestEntity({
        id: 3,
        startDate: new Date('2023-01-06'),
        endDate: new Date('2023-01-10'),
        type: ItemType.posts,
      });

      const instruction = ManifestUtils.computeMergeInRange([
        manifest3,
        manifest1,
        manifest2,
      ]);

      expect(instruction.discard).toHaveLength(2);
      expect(instruction.discard).toContain(manifest2);
      expect(instruction.discard).toContain(manifest3);
      expect(instruction.save).toHaveLength(1);
      expect(instruction.save[0]!.id).toBe(1); // Lowest ID is kept
      expect(instruction.save[0]!.startDate).toEqual(new Date('2023-01-01'));
      expect(instruction.save[0]!.endDate).toEqual(new Date('2023-01-10'));
    });
  });
});
