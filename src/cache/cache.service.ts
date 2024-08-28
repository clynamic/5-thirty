import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheEntity, CacheValue } from './cache.entity';

@Injectable()
export class CacheService {
  constructor(
    @InjectRepository(CacheEntity)
    private readonly cacheItemRepository: Repository<CacheEntity>,
  ) {}

  async get(id: string): Promise<CacheValue> {
    return (
      await this.cacheItemRepository.findOneOrFail({
        where: { id },
      })
    ).value;
  }

  async put(value: CacheValue): Promise<string> {
    return (await this.cacheItemRepository.save({ value })).id;
  }
}
