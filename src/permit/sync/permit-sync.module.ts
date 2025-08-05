import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/post.entity';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { PermitEntity } from '../permit.entity';
import { PermitSyncService } from './permit-sync.service';
import { PermitSyncWorker } from './permit-sync.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PermitEntity,
      PostEntity,
      PostVersionEntity,
      PostEventEntity,
    ]),
  ],
  providers: [PermitSyncService, PermitSyncWorker],
  exports: [],
})
export class PermitSyncModule {}
