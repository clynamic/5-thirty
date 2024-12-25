import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { ModActionEntity } from '../mod-action.entity';
import { ModActionSyncService } from './mod-action-sync.service';
import { ModActionSyncWorker } from './mod-action-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([ModActionEntity]), ManifestModule],
  providers: [ModActionSyncService, ModActionSyncWorker],
})
export class ModActionSyncModule {}
