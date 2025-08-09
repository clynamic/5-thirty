import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { TagImplicationEntity } from '../tag-implication.entity';
import { TagImplicationSyncService } from './tag-implication-sync.service';
import { TagImplicationSyncWorker } from './tag-implication-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([TagImplicationEntity]), ManifestModule],
  providers: [TagImplicationSyncService, TagImplicationSyncWorker],
})
export class TagImplicationSyncModule {}
