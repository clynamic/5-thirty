import { Module } from '@nestjs/common';

import { UploadMetricModule } from './metric/upload-metric.module';
import { UploadSyncModule } from './sync/upload-sync.module';
import { UploadTilesModule } from './tiles/upload-tiles.module';

@Module({
  imports: [UploadSyncModule, UploadMetricModule, UploadTilesModule],
})
export class UploadModule {}
