import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { PostFlagType } from 'src/api';
import {
  DateRange,
  fillDateCounts,
  PartialDateRange,
  SeriesCountPoint,
  toWhere,
} from 'src/utils';
import { Repository } from 'typeorm';

import { FlagEntity } from '../flag.entity';
import { PostDeletedUserQuery } from './flag-metric.dto';

@Injectable()
export class FlagMetricService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  async deletionActivitySummary(
    range?: PartialDateRange,
    user?: PostDeletedUserQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);

    const flags = await this.flagRepository.find({
      where: {
        type: PostFlagType.deletion,
        ...range?.where(),
        ...toWhere(user),
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
            count: deletionCounts[dateTime.toISO()!] ?? 0,
          }),
      );
  }

  async deletionSeries(
    range?: PartialDateRange,
    user?: PostDeletedUserQuery,
  ): Promise<SeriesCountPoint[]> {
    range = DateRange.fill(range);
    const flags = await this.flagRepository.find({
      where: {
        type: PostFlagType.deletion,
        ...range?.where(),
        ...toWhere(user),
      },
    });

    const counts: Record<string, number> = {};

    for (const flag of flags) {
      const createdDate = DateTime.fromJSDate(flag.createdAt).toISODate()!;
      counts[createdDate] = (counts[createdDate] || 0) + 1;
    }

    fillDateCounts(range, counts);

    return Object.entries(counts).map(
      ([date, count]) =>
        new SeriesCountPoint({
          date: new Date(date),
          count,
        }),
    );
  }
}
