import { Module } from '@nestjs/common';

import { TagImplicationSyncModule } from './sync/tag-implication-sync.module';

@Module({
  imports: [TagImplicationSyncModule],
})
export class TagImplicationModule {}
