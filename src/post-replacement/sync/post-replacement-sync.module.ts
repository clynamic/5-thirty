import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { PostReplacementEntity } from '../post-replacement.entity';
import { PostReplacementSyncService } from './post-replacement-sync.service';
import { PostReplacementSyncWorker } from './post-replacement-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([PostReplacementEntity]), ManifestModule],
  providers: [PostReplacementSyncService, PostReplacementSyncWorker],
})
export class PostReplacementSyncModule {}
