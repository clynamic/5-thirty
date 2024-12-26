import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { FeedbackEntity } from '../feedback.entity';
import { FeedbackSyncService } from './feedback-sync.service';
import { FeedbackSyncWorker } from './feedback-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([FeedbackEntity]), ManifestModule],
  providers: [FeedbackSyncService, FeedbackSyncWorker],
})
export class FeedbackSyncModule {}
