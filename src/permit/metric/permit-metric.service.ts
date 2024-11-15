import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import {
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
} from 'src/common';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
import { Repository } from 'typeorm';

import { PermitEntity } from '../permit.entity';

@Injectable()
export class PermitMetricService {
  constructor(
    @InjectRepository(PermitEntity)
    private readonly permitRepository: Repository<PermitEntity>,
    @InjectRepository(PostVersionEntity)
    private readonly postVersionRepository: Repository<PostVersionEntity>,
  ) {}

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
        results.map((result) => ({
          updatedAt: result.updated_at.replace(' ', 'T'),
        })),
      );

    return generateSeriesCountPoints(postVersions, range, (postVersion) =>
      DateTime.fromISO(postVersion.updatedAt, { zone: 'utc' }),
    );
  }
}
