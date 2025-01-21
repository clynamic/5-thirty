import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
} from 'src/common';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
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
      .getRawMany<{ updated_at: Date | string }>()
      .then((results) =>
        results.map((result) => ({
          updatedAt:
            // TODO: implement this more elegantly
            result.updated_at instanceof Date
              ? result.updated_at
              : new Date(result.updated_at.replace(' ', 'T') + 'Z'),
        })),
      );

    return generateSeriesCountPoints(
      postVersions.map((item) => item.updatedAt),
      range,
    );
  }
}
