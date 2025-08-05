import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { PostEventEntity } from '../post-event.entity';
import { PostEventSyncService } from './post-event-sync.service';
import { PostEventSyncWorker } from './post-event-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([PostEventEntity]), ManifestModule],
  providers: [PostEventSyncService, PostEventSyncWorker],
})
export class PostEventSyncModule {}
