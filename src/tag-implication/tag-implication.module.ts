import { Module } from '@nestjs/common';

import { TagImplicationSyncModule } from './sync/tag-implicaton-sync.module';

@Module({
  imports: [TagImplicationSyncModule],
})
export class TagImplicationModule {}
