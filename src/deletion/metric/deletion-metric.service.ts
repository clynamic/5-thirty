import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { PostFlagType } from 'src/api';
import {
  DateRange,
  fillDateCounts,
  PartialDateRange,
  SeriesCountPoint,
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

    const counts: Record<string, number> = {};

    for (const flag of flags) {
      const createdDate = DateTime.fromJSDate(flag.createdAt, {
        zone: range.timezone,
      }).toISODate()!;
      counts[createdDate] = (counts[createdDate] || 0) + 1;
    }

    fillDateCounts(range, counts);

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (date) =>
          new SeriesCountPoint({
            date: date.toJSDate(),
            value: counts[date.toISODate()!]!,
          }),
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

    const deletionCounts: Record<string, number> = {};
    let minDate: DateTime | null = null;
    let maxDate: DateTime | null = null;

    for (const flag of flags) {
      const createdDate = DateTime.fromJSDate(flag.createdAt, {
        zone: range.timezone,
      })
        .set({ year: 1970, month: 1, day: 1 })
        .startOf('hour');

      const createdHour = createdDate.toISO()!;
      deletionCounts[createdHour] = (deletionCounts[createdHour] || 0) + 1;

      minDate = DateTime.min(minDate ?? createdDate, createdDate);
      maxDate = DateTime.max(maxDate ?? createdDate, createdDate);
    }

    if (minDate && maxDate) {
      for (
        let currentDate = minDate;
        currentDate <= maxDate;
        currentDate = currentDate.plus({ hours: 1 })
      ) {
        const dateString = currentDate.toISO()!;
        if (!(dateString in deletionCounts)) {
          deletionCounts[dateString] = 0;
        }
      }
    }

    return Object.keys(deletionCounts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .sort()
      .map(
        (dateTime) =>
          new SeriesCountPoint({
            date: dateTime.toJSDate(),
            value: deletionCounts[dateTime.toISO()!] ?? 0,
          }),
      );
  }
}
