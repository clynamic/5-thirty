import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from 'src/job/job.module';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { PostLifecycleEntity } from './post-lifecycle.entity';
import { PostLifecycleService } from './post-lifecycle.service';
import { PermitLifecycleWorker } from './workers/permit-lifecycle.worker';
import { PostEventLifecycleWorker } from './workers/post-event-lifecycle.worker';
import { UploadLifecycleWorker } from './workers/upload-lifecycle.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostLifecycleEntity,
      PostVersionEntity,
      PostEventEntity,
      PermitEntity,
      ManifestEntity,
    ]),
    JobModule,
  ],
  providers: [
    PostLifecycleService,
    UploadLifecycleWorker,
    PostEventLifecycleWorker,
    PermitLifecycleWorker,
  ],
  exports: [PostLifecycleService],
})
export class PostLifecycleModule {}
