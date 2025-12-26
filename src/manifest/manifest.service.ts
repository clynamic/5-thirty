import { InjectRepository } from '@nestjs/typeorm';
import { startOfDay } from 'date-fns';
import { Cacheable, withInvalidation } from 'src/app/browser.module';
import { DateRange, TimeScale } from 'src/common';
import { ItemType } from 'src/label/label.entity';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';

import { ManifestAvailability, ManifestQuery } from './manifest.dto';
import { ManifestEntity, Order, OrderResults } from './manifest.entity';
import { ManifestRewrite, ManifestUtils } from './manifest.utils';

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

  @Cacheable({
    prefix: 'manifest',
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

  @Cacheable({
    prefix: 'manifest',
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

  @Cacheable({
    prefix: 'manifest',
    ttl: 15 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
  async listOrdersByRange(type: ItemType, range: DateRange): Promise<Order[]> {
    range = range.expand(TimeScale.Day);
    const manifests = await this.list(range, { type: [type] });
    return ManifestUtils.computeOrders(manifests, range);
  }

  @Cacheable({
    prefix: 'manifest',
    ttl: 10 * 60 * 1000,
    dependencies: [ManifestEntity],
  })
  async available(
    range: DateRange,
    type: ItemType[],
  ): Promise<ManifestAvailability> {
    const manifests = await this.list(range, { type: type });
    const currentTime = startOfDay(Date.now());

    const availability = ManifestUtils.computeAvailability(
      manifests,
      range,
      type,
      currentTime,
    );

    return new ManifestAvailability({
      ...availability,
    });
  }

  async saveResults(results: OrderResults): Promise<Order> {
    const {
      discard,
      save,
      order: update,
    } = ManifestUtils.computeSaveResults(results);

    await this.remove(discard);
    await this.save(save);
    return this.updateOrder(results.order, update);
  }

  async updateOrder(order: Order, update: Partial<Order>): Promise<Order> {
    return new Order({
      ...order,
      lower:
        update.lower instanceof ManifestEntity
          ? await this.save(update.lower)
          : update.lower,
      upper:
        update.upper instanceof ManifestEntity
          ? await this.save(update.upper)
          : update.upper,
    });
  }

  async mergeInRange(type: ItemType, range: DateRange): Promise<void> {
    const manifests = await this.list(range, { type: [type] });
    const instruction = ManifestUtils.computeMergeInRange(manifests);
    await this.rewrite(instruction);
  }

  async rewrite(instruction: ManifestRewrite): Promise<ManifestEntity[]> {
    await this.remove(instruction.discard);
    return this.save(instruction.save);
  }
}
