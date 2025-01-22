import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { FlagEntity } from '../flag.entity';

@Injectable()
export class FlagSyncService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  firstFromId(id: number) {
    return this.flagRepository.findOne({
      where: {
        id: MoreThanOrEqual(id),
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async countUpdated(
    updated: Pick<FlagEntity, 'id' | 'updatedAt'>[],
  ): Promise<number> {
    const ids = updated.map((r) => r.id);
    const stored = await this.flagRepository.findBy({
      id: In(ids),
    });

    const dbUpdatedAtMap = new Map(
      stored.map((r) => [r.id, r.updatedAt.toISOString()]),
    );

    let count = 0;
    for (const replacement of updated) {
      const dbUpdatedAt = dbUpdatedAtMap.get(replacement.id);
      if (dbUpdatedAt && dbUpdatedAt !== replacement.updatedAt.toISOString()) {
        count++;
      }
    }

    return count;
  }

  save = this.flagRepository.save.bind(this.flagRepository);
}
