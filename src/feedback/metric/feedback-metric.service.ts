import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFeedbackCategory } from 'src/api';
import {
  DateRange,
  generateSeriesRecordPoints,
  PartialDateRange,
  Raw,
} from 'src/common';
import { Repository } from 'typeorm';

import { FeedbackEntity } from '../feedback.entity';
import {
  FeedbackCountGroup,
  FeedbackCountSeriesPoint,
  FeedbackTypeSummary,
} from './feedback-metric.dto';

@Injectable()
export class FeedbackMetricService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  async typeSummary(range?: PartialDateRange): Promise<FeedbackTypeSummary> {
    return new FeedbackTypeSummary({
      ...Object.fromEntries(
        await Promise.all(
          Object.values(UserFeedbackCategory).map(async (category) => [
            category,
            await this.feedbackRepository.count({
              where: { category, ...DateRange.fill(range).where() },
            }),
          ]),
        ),
      ),
    });
  }

  async countSeries(
    range?: PartialDateRange,
  ): Promise<FeedbackCountSeriesPoint[]> {
    range = DateRange.fill(range);
    const feedbacks = await this.feedbackRepository.find({
      where: DateRange.fill(range).where(),
    });

    return generateSeriesRecordPoints<Raw<FeedbackCountGroup>>(
      feedbacks.map((e) => e.createdAt),
      feedbacks.map((e) => e.category),
      ['negative', 'neutral', 'positive'] as const,
      range,
    ).map(
      (e) =>
        new FeedbackCountSeriesPoint({
          date: e.date,
          groups: e.value,
        }),
    );
  }
}
