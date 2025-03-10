import { Module } from '@nestjs/common';

import { TagAliasSyncModule } from './sync/tag-alias-sync.module';

@Module({
  imports: [TagAliasSyncModule],
})
export class TagAliasModule {}
