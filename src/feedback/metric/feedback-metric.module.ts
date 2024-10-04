import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedbackEntity } from '../feedback.entity';
import { FeedbackMetricController } from './feedback-metric.controller';
import { FeedbackMetricService } from './feedback-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeedbackEntity])],
  controllers: [FeedbackMetricController],
  providers: [FeedbackMetricService],
})
export class FeedbackMetricModule {}
