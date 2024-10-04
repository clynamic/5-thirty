import { Module } from '@nestjs/common';

import { FlagSyncModule } from './sync/flag-sync.module';

@Module({
  imports: [FlagSyncModule],
})
export class FlagModule {}
