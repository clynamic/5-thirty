import { Module } from '@nestjs/common';

import { ModActionSyncModule } from './sync/mod-action-sync.module';

@Module({
  imports: [ModActionSyncModule],
})
export class ModActionModule {}
