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
} from 'src/common';
import { FlagEntity } from 'src/flag/flag.entity';
import { Repository } from 'typeorm';

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
