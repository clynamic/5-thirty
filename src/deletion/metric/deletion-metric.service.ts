import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { set } from 'date-fns';
import { PostEventAction } from 'src/api';
import { Cacheable } from 'src/app/browser.module';
import {
  DateRange,
  PartialDateRange,
  SeriesCountPoint,
  TimeScale,
  generateSeriesCountPoints,
} from 'src/common';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { In } from 'typeorm';
import { Repository } from 'typeorm';

import {
  DeletionActivitySummaryQuery,
  DeletionCountSeriesQuery,
} from './deletion-metric.dto';

@Injectable()
export class DeletionMetricService {
  constructor(
    @InjectRepository(PostEventEntity)
    private readonly postEventRepository: Repository<PostEventEntity>,
  ) {}

  @Cacheable({
    prefix: 'deletion',
    ttl: 10 * 60 * 1000,
    dependencies: [PostEventEntity],
  })
  async countSeries(
    range?: PartialDateRange,
    query?: DeletionCountSeriesQuery,
  ): Promise<SeriesCountPoint[]> {
    const filledRange = DateRange.fill(range);

    const events = await this.postEventRepository.find({
      where: {
        action: In([PostEventAction.deleted, PostEventAction.undeleted]),
        createdAt: filledRange.find(),
        ...(query?.creatorId && { creatorId: query.creatorId }),
      },
      order: { createdAt: 'ASC' },
      select: ['postId', 'action', 'createdAt'],
    });

    const result = Array.from(
      events
        .reduce(
          (map, event) => map.set(event.postId, event),
          new Map<number, PostEventEntity>(),
        )
        .values(),
    ).filter((event) => event.action === PostEventAction.deleted);

    return generateSeriesCountPoints(
      result.map((event) => event.createdAt),
      filledRange,
    );
  }

  @Cacheable({
    prefix: 'deletion',
    ttl: 15 * 60 * 1000,
    dependencies: [PostEventEntity],
  })
  async activitySummary(
    range?: PartialDateRange,
    query?: DeletionActivitySummaryQuery,
  ): Promise<SeriesCountPoint[]> {
    const filledRange = DateRange.fill(range);

    const events = await this.postEventRepository.find({
      where: {
        action: In([PostEventAction.deleted, PostEventAction.undeleted]),
        createdAt: filledRange.find(),
        ...(query?.creatorId && { creatorId: query.creatorId }),
      },
      order: { createdAt: 'ASC' },
    });

    const result = Array.from(
      events
        .reduce(
          (map, event) => map.set(event.postId, event),
          new Map<number, PostEventEntity>(),
        )
        .values(),
    ).filter((event) => event.action === PostEventAction.deleted);

    const dates = result
      .map((event) =>
        !query || event.creatorId === query.creatorId
          ? set(event.createdAt, { year: 1970, month: 1, date: 1 })
          : null,
      )
      .filter((date): date is Date => date !== null);

    return generateSeriesCountPoints(
      dates,
      new DateRange({
        startDate: new Date(1970, 1, 1),
        endDate: new Date(1970, 1, 1, 23, 59, 59, 999),
        scale: TimeScale.Hour,
        timezone: filledRange.timezone,
      }),
    );
  }
}
