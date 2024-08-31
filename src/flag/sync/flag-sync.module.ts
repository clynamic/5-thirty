import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { FlagEntity } from '../flag.entity';
import { FlagSyncService } from './flag-sync.service';
import { FlagSyncWorker } from './flag-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([FlagEntity]), ManifestModule],
  providers: [FlagSyncService, FlagSyncWorker],
})
export class FlagSyncModule {}
