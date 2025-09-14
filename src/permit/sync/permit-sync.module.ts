import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';
import { PostEventEntity } from 'src/post-event/post-event.entity';

import { PermitEntity } from '../permit.entity';
import { PermitSyncService } from './permit-sync.service';
import { PermitSyncWorker } from './permit-sync.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([PermitEntity, PostEventEntity]),
    ManifestModule,
  ],
  providers: [PermitSyncService, PermitSyncWorker],
  exports: [PermitSyncService],
})
export class PermitSyncModule {}
