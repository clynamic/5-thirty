import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DateRange,
  generateSeriesRecordPoints,
  PartialDateRange,
  Raw,
  toRawQuery,
} from 'src/common';
import { Repository } from 'typeorm';
import { Cacheable } from 'src/app/browser.module';

import { FeedbackEntity } from '../feedback.entity';
import {
  FeedbackTypeCount,
  FeedbackTypeQuery,
  FeedbackTypeSeriesPoint,
} from './feedback-metric.dto';

@Injectable()
export class FeedbackMetricService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  static getTypeKey(
    range?: PartialDateRange,
    query?: FeedbackTypeQuery,
  ): string {
    return `feedback-type?${toRawQuery({ ...range, ...query })}`;
  }

  @Cacheable(FeedbackMetricService.getTypeKey, {
    ttl: 10 * 60 * 1000,
    dependencies: [FeedbackEntity],
  })
  async type(
    range?: PartialDateRange,
    query?: FeedbackTypeQuery,
  ): Promise<FeedbackTypeSeriesPoint[]> {
    range = DateRange.fill(range);
    const feedbacks = await this.feedbackRepository.find({
      where: {
        ...range.where(),
        ...query?.where(),
      },
    });

    return generateSeriesRecordPoints<Raw<FeedbackTypeCount>>(
      feedbacks.map((e) => e.createdAt),
      feedbacks.map((e) => e.category),
      ['negative', 'neutral', 'positive'] as const,
      range,
    ).map(
      (e) =>
        new FeedbackTypeSeriesPoint({
          date: e.date,
          ...e.value,
        }),
    );
  }
}
