import { Module } from '@nestjs/common';

import { PostMetricModule } from './metric/post-metric.module';
import { PostPendingTilesModule } from './tiles/post-pending-tiles.module';

@Module({
  imports: [PostMetricModule, PostPendingTilesModule],
})
export class PostModule {}
