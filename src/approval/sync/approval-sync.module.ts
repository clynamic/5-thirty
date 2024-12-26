import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { ApprovalEntity } from '../approval.entity';
import { ApprovalSyncService } from './approval-sync.service';
import { ApprovalSyncWorker } from './approval-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity]), ManifestModule],
  providers: [ApprovalSyncService, ApprovalSyncWorker],
})
export class ApprovalSyncModule {}
