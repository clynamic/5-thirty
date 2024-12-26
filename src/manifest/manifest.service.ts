import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import {
  DateRange,
  findHighestId,
  findLowestDate,
  findLowestId,
  resolveWithDate,
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
    const date1 = DateTime.fromJSDate(Order.getBoundaryDate(boundary1, side1));
    const date2 = DateTime.fromJSDate(Order.getBoundaryDate(boundary2, side2));

    if (
      boundary1 instanceof ManifestEntity &&
      boundary2 instanceof ManifestEntity
    ) {
      return (
        date1.equals(date2) ||
        date1.plus({ milliseconds: 1 }).equals(date2) ||
        date2.plus({ milliseconds: 1 }).equals(date1)
      );
    }

    if (
      boundary1 instanceof ManifestEntity ||
      boundary2 instanceof ManifestEntity
    ) {
      return date1.equals(date2);
    }

    return date1.equals(date2);
  }

  static isBoundaryBefore(
    boundary1: OrderBoundary,
    boundary2: OrderBoundary,
    side1: OrderSide,
    side2: OrderSide,
  ): boolean {
    return (
      DateTime.fromJSDate(Order.getBoundaryDate(boundary1, side1)) <
      DateTime.fromJSDate(Order.getBoundaryDate(boundary2, side2))
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
      const lowerDate = DateTime.fromJSDate(order.lowerDate);
      const upperDate = DateTime.fromJSDate(order.upperDate);

      let currentStart = lowerDate;
      const originalLowerBoundary = order.lower;
      const originalUpperBoundary = order.upper;

      while (currentStart < upperDate) {
        const currentEnd = DateTime.min(
          currentStart.plus({ days: maxOrderDuration }).endOf('day'),
          upperDate,
        );

        if (currentStart.equals(lowerDate)) {
          splitOrders.push(
            new Order({
              lower: originalLowerBoundary,
              upper: currentEnd.toJSDate(),
            }),
          );
        } else if (currentEnd.equals(upperDate)) {
          splitOrders.push(
            new Order({
              lower: currentStart.toJSDate(),
              upper: originalUpperBoundary,
            }),
          );
        } else {
          splitOrders.push(
            new Order({
              lower: currentStart.toJSDate(),
              upper: currentEnd.toJSDate(),
            }),
          );
        }

        currentStart = currentEnd.plus({ days: 1 }).startOf('day');
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
    const currentDate = DateTime.now().startOf('day');

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
          endDate: DateTime.min(
            DateTime.fromJSDate(order.upper),
            currentDate,
          ).toJSDate(),
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
            DateTime.min(
              DateTime.fromJSDate(order.upper),
              currentDate,
            ).toJSDate(),
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
          endDate: DateTime.min(
            DateTime.fromJSDate(order.upper),
            currentDate,
          ).toJSDate(),
        });

        this.save(order.upper);
      } else {
        // abort without data
      }
    }
  }

  async mergeInRange(type: ItemType, range: DateRange): Promise<void> {
    const manifests = await this.listByRange(type, range);

    manifests.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let i = 0; i < manifests.length; i++) {
      const manifestA = manifests[i]!;

      while (i + 1 < manifests.length) {
        const manifestB = manifests[i + 1]!;

        if (
          DateTime.fromJSDate(manifestB.endDate) <
          DateTime.fromJSDate(manifestA.endDate)
        ) {
          await this.remove(manifestB);
          i++;
        } else if (
          DateTime.fromJSDate(manifestB.startDate) <
          DateTime.fromJSDate(manifestA.endDate)
        ) {
          this.merge(manifestA, manifestB);
          i++;
        } else if (
          DateTime.fromJSDate(manifestB.startDate).equals(
            DateTime.fromJSDate(manifestA.endDate).plus({ milliseconds: 1 }),
          )
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
    lower.extendWith(upper, 'end');

    await this.manifestRepository.remove(upper);
    return this.manifestRepository.save(lower);
  }
}
