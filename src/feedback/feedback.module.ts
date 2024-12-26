import { Module } from '@nestjs/common';

import { FeedbackMetricModule } from './metric/feedback-metric.module';
import { FeedbackSyncModule } from './sync/feedback-sync.module';

@Module({
  imports: [FeedbackSyncModule, FeedbackMetricModule],
})
export class FeedbackModule {}
