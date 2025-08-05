import { Module } from '@nestjs/common';

import { ApprovalMetricModule } from './metric/approval-metric.module';

@Module({
  imports: [ApprovalMetricModule],
})
export class ApprovalModule {}
