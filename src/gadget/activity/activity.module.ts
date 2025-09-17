import { Module } from '@nestjs/common';
import { ApprovalMetricModule } from 'src/approval/metric/approval-metric.module';
import { DeletionMetricModule } from 'src/deletion/metric/deletion-metric.module';
import { PostReplacementMetricModule } from 'src/post-replacement/metric/post-replacement-metric.module';
import { TicketMetricModule } from 'src/ticket/metric/ticket-metric.module';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    ApprovalMetricModule,
    DeletionMetricModule,
    PostReplacementMetricModule,
    TicketMetricModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
