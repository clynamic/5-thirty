import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSyncModule } from 'src/user/sync/user-sync.module';

import { PostEntity } from '../post.entity';
import { PostSyncService } from './post-sync.service';
import { PostSyncWorker } from './post-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), UserSyncModule],
  controllers: [],
  providers: [PostSyncService, PostSyncWorker],
})
export class PostSyncModule {}
