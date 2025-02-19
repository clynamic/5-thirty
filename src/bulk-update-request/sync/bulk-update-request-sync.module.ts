import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { BulkUpdateRequestEntity } from '../bulk-update-request.entity';
import { BulkUpdateRequestSyncService } from './bulk-update-request-sync.service';
import { BulkUpdateRequestSyncWorker } from './bulk-update-request-sync.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([BulkUpdateRequestEntity]),
    ManifestModule,
  ],
  providers: [BulkUpdateRequestSyncService, BulkUpdateRequestSyncWorker],
})
export class BulkUpdateRequestSyncModule {}
