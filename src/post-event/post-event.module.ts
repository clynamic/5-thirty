import { Module } from '@nestjs/common';

import { PostEventSyncModule } from './sync/post-event-sync.module';

@Module({
  imports: [PostEventSyncModule],
})
export class PostEventModule {}
