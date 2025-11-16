import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from 'src/job/job.module';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { UploadTilesEntity } from './upload-tiles.entity';
import { UploadTilesService } from './upload-tiles.service';
import { UploadTilesWorker } from './upload-tiles.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UploadTilesEntity,
      PostVersionEntity,
      ManifestEntity,
    ]),
    JobModule,
  ],
  providers: [UploadTilesService, UploadTilesWorker],
  exports: [UploadTilesService],
})
export class UploadTilesModule {}
