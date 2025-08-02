import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  convertKeysToCamelCase,
  convertKeysToDate,
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
  toRawQuery,
} from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import { PermitEntity } from '../permit.entity';

@Injectable()
export class PermitMetricService {
  constructor(
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

  @Cacheable({
    prefix: 'permit',
    ttl: 10 * 60 * 1000,
    dependencies: [PermitEntity, PostVersionEntity],
  })
  async count(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const postVersions = await this.postVersionRepository
      .createQueryBuilder('post_version')
      .select('post_version.updated_at', 'updated_at')
      .where({ updatedAt: range.find() })
      .andWhere('post_version.version = 1')
      .innerJoin(
        this.permitRepository.metadata.tableName,
        'permit',
        'permit.postId = post_version.post_id',
      )
      .getRawMany<{ updated_at: string }>()
      .then((results) =>
        results
          .map(convertKeysToCamelCase)
          .map((result) => convertKeysToDate(result, ['updatedAt'])),
      );

    return generateSeriesCountPoints(
      postVersions.map((item) => item.updatedAt),
      range,
    );
  }
}
