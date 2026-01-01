import { Module } from '@nestjs/common';

import { PostLifecycleModule } from './lifecycle/post-lifecycle.module';
import { PostMetricModule } from './metric/post-metric.module';

@Module({
  imports: [PostMetricModule, PostLifecycleModule],
})
export class PostModule {}
