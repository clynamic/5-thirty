import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { set } from 'date-fns';
import { PostFlagType } from 'src/api';
import {
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
  toRawQuery,
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import {
  DeletionActivitySummaryQuery,
  DeletionCountSeriesQuery,
} from './deletion-metric.dto';

@Injectable()
export class DeletionMetricService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  static getCountSeriesKey(
    range?: PartialDateRange,
    query?: DeletionCountSeriesQuery,
  ): string {
    return `deletion-count-series?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(DeletionMetricService.getCountSeriesKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [FlagEntity],
  })
  async countSeries(
    range?: PartialDateRange,
    query?: DeletionCountSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);
    const flags = await this.flagRepository.find({
      where: {
        type: PostFlagType.deletion,
        ...range?.where(),
        ...query?.where(),
      },
    });

    return generateSeriesCountPoints(
      flags.map((flag) => flag.createdAt),
      range,
    );
  }

  static getActivitySummaryKey(
    range?: PartialDateRange,
    query?: DeletionActivitySummaryQuery,
  ): string {
    return `deletion-activity-summary?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(DeletionMetricService.getActivitySummaryKey, {
    ttl: 15 * 60 * 1000,
    dependencies: [FlagEntity],
  })
  async activitySummary(
    range?: PartialDateRange,
    query?: DeletionActivitySummaryQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const flags = await this.flagRepository.find({
      where: {
        type: PostFlagType.deletion,
        ...range?.where(),
        ...query?.where(),
      },
    });

    const dates = flags
      .map((flag) =>
        !query || flag.creatorId === query.creatorId
          ? set(flag.createdAt, { year: 1970, month: 1, date: 1 })
          : null,
      )
      .filter((date): date is Date => date !== null)
      .flat();

    return generateSeriesCountPoints(
      dates,
      new DateRange({
        startDate: new Date(1970, 1, 1),
        endDate: new Date(1970, 1, 1, 23, 59, 59, 999),
        scale: TimeScale.Hour,
        timezone: range.timezone,
      }),
    );
  }
}
