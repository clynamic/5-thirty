import {
  FindOneOptions,
  FindOptionsWhere,
  In,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { WithDate, resolveWithDate } from './date-objects';
import { WithId } from './id-range.dto';

export function constructFirstFromId<T extends WithId>(
  repository: Repository<T>,
) {
  return function (id: number): Promise<T | null> {
    return repository.findOne({
      where: { id: MoreThanOrEqual(id) },
      order: { id: 'ASC' },
    } as FindOneOptions<T>);
  };
}

export function constructCountUpdated<T extends WithId & WithDate>(
  repository: Repository<T>,
) {
  return async function (
    updated: (Pick<T, 'id'> & WithDate)[],
  ): Promise<number> {
    const ids = updated.map((r) => r.id);
    const stored = await repository.findBy({
      id: In(ids),
    } as FindOptionsWhere<T>);

    const updatedDates = new Map(
      stored.map((r) => [r.id, resolveWithDate(r).toISOString()]),
    );

    let count = 0;
    for (const item of updated) {
      const dbUpdatedAt = updatedDates.get(item.id);
      if (dbUpdatedAt && dbUpdatedAt !== resolveWithDate(item).toISOString()) {
        count++;
      }
    }

    return count;
  };
}
