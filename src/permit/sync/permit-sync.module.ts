import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { PostEntity } from 'src/post/post.entity';
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
      ApprovalEntity,
      FlagEntity,
    ]),
  ],
  providers: [PermitSyncService, PermitSyncWorker],
  exports: [],
})
export class PermitSyncModule {}
