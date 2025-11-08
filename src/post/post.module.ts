import { Module } from '@nestjs/common';

import { PostMetricModule } from './metric/post-metric.module';

@Module({
  imports: [PostMetricModule],
})
export class PostModule {}
