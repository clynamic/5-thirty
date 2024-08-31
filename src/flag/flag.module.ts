import { Module } from '@nestjs/common';

import { FlagMetricModule } from './metric/flag-metric.module';
import { FlagSyncModule } from './sync/flag-sync.module';

@Module({
  imports: [FlagMetricModule, FlagSyncModule],
})
export class FlagModule {}
