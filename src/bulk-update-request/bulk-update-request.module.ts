import { Module } from '@nestjs/common';

import { BulkUpdateRequestSyncModule } from './sync/bulk-update-request-sync.module';

@Module({
  imports: [BulkUpdateRequestSyncModule],
})
export class BulkUpdateRequestModule {}
