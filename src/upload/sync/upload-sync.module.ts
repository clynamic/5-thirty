import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';
import { PostVersionEntity } from 'src/post_version/post_version.entity';

import { UploadSyncService } from './upload-sync.service';
import { UploadSyncWorker } from './upload-sync.worker';

@Module({
  imports: [ManifestModule, TypeOrmModule.forFeature([PostVersionEntity])],
  controllers: [],
  providers: [UploadSyncService, UploadSyncWorker],
})
export class UploadSyncModule {}
