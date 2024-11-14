import { Module } from '@nestjs/common';

import { UploadMetricModule } from './metric/upload-metric.module';
import { UploadSyncModule } from './sync/upload-sync.module';

@Module({
  imports: [UploadSyncModule, UploadMetricModule],
  controllers: [],
  providers: [],
})
export class UploadModule {}
