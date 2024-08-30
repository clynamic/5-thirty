import { Module } from '@nestjs/common';

import { PostSyncModule } from './sync/post-sync.module';

@Module({
  imports: [PostSyncModule],
  controllers: [],
  providers: [],
})
export class PostModule {}
