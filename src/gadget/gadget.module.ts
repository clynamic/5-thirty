import { Module } from '@nestjs/common';
import { ApprovalMetricModule } from 'src/approval/metric/approval-metric.module';
import { DeletionMetricModule } from 'src/deletion/metric/deletion-metric.module';
import { PostReplacementMetricModule } from 'src/post-replacement/metric/post-replacement-metric.module';
import { TicketMetricModule } from 'src/ticket/metric/ticket-metric.module';

import { GadgetController } from './gadget.controller';
import { GadgetService } from './gadget.service';

@Module({
  imports: [
    ApprovalMetricModule,
    DeletionMetricModule,
    PostReplacementMetricModule,
    TicketMetricModule,
  ],
  controllers: [GadgetController],
  providers: [GadgetService],
})
export class GadgetModule {}
