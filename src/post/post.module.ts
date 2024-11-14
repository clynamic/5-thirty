import { Module } from '@nestjs/common';

import { PostMetricModule } from './metric/post-metric.module';
import { PostSyncModule } from './sync/post-sync.module';

@Module({
  imports: [PostSyncModule, PostMetricModule],
  controllers: [],
  providers: [],
})
export class PostModule {}
