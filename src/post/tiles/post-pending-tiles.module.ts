import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from 'src/job/job.module';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { PostPendingTilesEntity } from './post-pending-tiles.entity';
import { PostPendingTilesService } from './post-pending-tiles.service';
import { PostPendingTilesWorker } from './post-pending-tiles.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostPendingTilesEntity,
      PostVersionEntity,
      PostEventEntity,
      PermitEntity,
      ManifestEntity,
    ]),
    JobModule,
  ],
  providers: [PostPendingTilesService, PostPendingTilesWorker],
  exports: [PostPendingTilesService],
})
export class PostPendingTilesModule {}
