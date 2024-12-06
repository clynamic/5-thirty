import { Module } from '@nestjs/common';

import { PostReplacementMetricModule } from './metric/post-replacement-metric.module';
import { PostReplacementSyncModule } from './sync/post-replacement-sync.module';

@Module({
  imports: [PostReplacementSyncModule, PostReplacementMetricModule],
})
export class PostReplacementModule {}
