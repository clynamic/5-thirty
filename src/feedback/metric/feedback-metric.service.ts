import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { UserFeedbackCategory } from 'src/api';
import { DateRange, fillStackedDateCounts, PartialDateRange } from 'src/utils';
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

    const counts: Record<
      string,
      Partial<Record<UserFeedbackCategory, number>>
    > = {};

    for (const feedback of feedbacks) {
      const createdDate = DateTime.fromJSDate(feedback.createdAt, {
        zone: range.timezone,
      });
      const dateString = createdDate.toISODate()!;
      counts[dateString] = counts[dateString] || {};
      counts[dateString][feedback.category] =
        (counts[dateString][feedback.category] || 0) + 1;
    }

    fillStackedDateCounts(range, counts, Object.values(UserFeedbackCategory));

    return Object.keys(counts)
      .map((date) => DateTime.fromISO(date, { zone: range.timezone }))
      .map(
        (date) =>
          new FeedbackCountSeriesPoint({
            date: date.toJSDate(),
            groups: new FeedbackCountGroup({
              ...(counts[date.toISODate()!]! as Record<
                UserFeedbackCategory,
                number
              >), // we know this is safe because we just filled it
            }),
          }),
      );
  }
}
