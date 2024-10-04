import { Module } from '@nestjs/common';

import { DeletionMetricModule } from './metric/deletion-metric.module';

@Module({
  imports: [DeletionMetricModule],
})
export class DeletionModule {}
