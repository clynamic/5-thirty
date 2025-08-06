import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { max, min } from 'date-fns';
import { PostReplacementStatus } from 'src/api';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PartialDateRange,
  SeriesCountPoint,
  generateSeriesCountPoints,
  generateSeriesRecordPoints,
} from 'src/common';
import { FindOptionsWhere, Not, Repository } from 'typeorm';

import { PostReplacementEntity } from '../post-replacement.entity';
import { PostReplacementStatusPoint } from './post-replacement-metric.dto';

@Injectable()
export class PostReplacementMetricService {
  constructor(
    @InjectRepository(PostReplacementEntity)
    private readonly postReplacementRepository: Repository<PostReplacementEntity>,
  ) {}

  private whereCreatedOrUpdated(
    range?: PartialDateRange,
    options?: FindOptionsWhere<PostReplacementEntity>,
  ): FindOptionsWhere<PostReplacementEntity>[] {
    range = DateRange.fill(range);
    return [
      {
        createdAt: range.find(),
        ...options,
      },
      {
        updatedAt: range.find(),
        ...options,
      },
    ];
  }

  @Cacheable({
    prefix: 'post-replacement',
    ttl: 10 * 60 * 1000,
    dependencies: [PostReplacementEntity],
  })
  async created(range?: PartialDateRange): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const replacements = await this.postReplacementRepository.find({
      where: {
        createdAt: range.find(),
        status: Not(PostReplacementStatus.original),
      },
    });

    const dates = replacements.map((replacement) => replacement.createdAt);

    return generateSeriesCountPoints(dates, range);
  }

  @Cacheable({
    prefix: 'post-replacement',
    ttl: 10 * 60 * 1000,
    dependencies: [PostReplacementEntity],
  })
  async status(
    range?: PartialDateRange,
  ): Promise<PostReplacementStatusPoint[]> {
    range = DateRange.fill(range);

    const replacements = await this.postReplacementRepository.find({
      where: this.whereCreatedOrUpdated(range, {
        status: Not(PostReplacementStatus.original),
      }),
    });

    const keys = replacements.map((replacement) => replacement.status);

    // "original" is not a status we care about.
    const allKeys = ['pending', 'rejected', 'approved', 'promoted'] as const;

    const dates = replacements.map((replacement) => {
      if (replacement.createdAt === replacement.updatedAt) {
        return replacement.createdAt;
      }

      return new DateRange({
        startDate: max([replacement.createdAt, range.startDate!]),
        endDate: min([replacement.updatedAt, range.endDate!]),
      });
    });

    return generateSeriesRecordPoints<
      Record<keyof typeof PostReplacementStatus, number>
    >(dates, keys, allKeys, range).map(
      (point) =>
        new PostReplacementStatusPoint({
          ...point.value,
          date: point.date,
        }),
    );
  }
}
