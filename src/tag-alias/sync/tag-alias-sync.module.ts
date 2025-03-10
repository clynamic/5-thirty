import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { TagAliasEntity } from '../tag-alias.entity';
import { TagAliasSyncService } from './tag-alias-sync.service';
import { TagAliasSyncWorker } from './tag-alias-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([TagAliasEntity]), ManifestModule],
  providers: [TagAliasSyncService, TagAliasSyncWorker],
})
export class TagAliasSyncModule {}
