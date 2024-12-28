import { Module } from '@nestjs/common';

import { PerformanceMetricModule } from './metric/performance-metric.module';

@Module({
  imports: [PerformanceMetricModule],
})
export class PerformanceModule {}
