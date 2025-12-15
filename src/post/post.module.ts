import { Module } from '@nestjs/common';

import { PostLifecycleModule } from './lifecycle/post-lifecycle.module';
import { PostMetricModule } from './metric/post-metric.module';
import { PostPendingTilesModule } from './tiles/post-pending-tiles.module';

@Module({
  imports: [PostMetricModule, PostPendingTilesModule, PostLifecycleModule],
})
export class PostModule {}
