import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { PostFlagType } from 'src/api';
import { DateRange, fillDateCounts, PartialDateRange } from 'src/utils';
import { Repository } from 'typeorm';

import { FlagEntity } from '../flag.entity';
import { PostDeletedPoint, PostDeletedUserQuery } from './flag-metric.dto';

@Injectable()
export class FlagMetricService {
  constructor(
    @InjectRepository(FlagEntity)
    private readonly flagRepository: Repository<FlagEntity>,
  ) {}

  async deletionSeries(
    range?: PartialDateRange,
    user?: PostDeletedUserQuery,
  ): Promise<PostDeletedPoint[]> {
    range = DateRange.fill(range);
    const flags = await this.flagRepository.find({
      where: {
        type: PostFlagType.deletion,
        ...range?.where(),
        ...user?.where(),
      },
    });

    const counts: Record<string, number> = {};

    for (const flag of flags) {
      const createdDate = DateTime.fromJSDate(flag.createdAt).toISODate()!;
      counts[createdDate] = (counts[createdDate] || 0) + 1;
    }

    fillDateCounts(range, counts);

    return Object.entries(counts).map(([date, count]) => ({
      date: new Date(date),
      count,
    }));
  }
}
