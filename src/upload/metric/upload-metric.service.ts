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

import { PostUploadSeriesQuery } from './upload-metric.dto';

@Injectable()
export class UploadMetricService {
  constructor(
    @InjectRepository(PostVersionEntity)
    private readonly postVersionService: Repository<PostVersionEntity>,
  ) {}

  async count(
    range?: PartialDateRange,
    query?: PostUploadSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const postVersions = await this.postVersionService.find({
      select: ['updatedAt'],
      where: {
        version: 1, // only uploads
        updatedAt: range.find(),
        ...query?.where(),
      },
    });

    return generateSeriesCountPoints(postVersions, range, (postVersion) =>
      DateTime.fromJSDate(postVersion.updatedAt),
    );
  }
}
