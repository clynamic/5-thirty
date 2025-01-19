import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { PostReplacementEntity } from '../post-replacement.entity';

@Injectable()
export class PostReplacementSyncService {
  constructor(
    @InjectRepository(PostReplacementEntity)
    private readonly postReplacementRepository: Repository<PostReplacementEntity>,
  ) {}

  save = this.postReplacementRepository.save.bind(
    this.postReplacementRepository,
  );

  async countUpdated(
    updated: Pick<PostReplacementEntity, 'id' | 'updatedAt'>[],
  ): Promise<number> {
    const ids = updated.map((r) => r.id);
    const stored = await this.postReplacementRepository.findBy({
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

  firstFromId(id: number) {
    return this.postReplacementRepository.findOne({
      where: {
        id: MoreThanOrEqual(id),
      },
      order: {
        id: 'ASC',
      },
    });
  }
}
