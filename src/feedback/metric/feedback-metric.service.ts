import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DateRange,
  generateSeriesRecordPoints,
  PartialDateRange,
  Raw,
} from 'src/common';
import { Repository } from 'typeorm';

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
