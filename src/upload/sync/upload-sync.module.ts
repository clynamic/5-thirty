import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { UserSyncModule } from 'src/user/sync/user-sync.module';

import { UploadSyncService } from './upload-sync.service';
import { UploadSyncWorker } from './upload-sync.worker';

@Module({
  imports: [
    ManifestModule,
    TypeOrmModule.forFeature([PostVersionEntity]),
    UserSyncModule,
  ],
  controllers: [],
  providers: [UploadSyncService, UploadSyncWorker],
})
export class UploadSyncModule {}
