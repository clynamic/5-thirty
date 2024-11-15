import { Module } from '@nestjs/common';

import { PermitMetricModule } from './metric/permit-metric.module';
import { PermitSyncModule } from './sync/permit-sync.module';

@Module({
  imports: [PermitSyncModule, PermitMetricModule],
  controllers: [],
  providers: [],
})
export class PermitModule {}
