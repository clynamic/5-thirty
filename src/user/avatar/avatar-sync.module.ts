import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/post.entity';
import { UserSyncModule } from 'src/user/sync/user-sync.module';

import { AvatarSyncService } from './avatar-sync.service';
import { AvatarSyncWorker } from './avatar-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity]), UserSyncModule],
  providers: [AvatarSyncService, AvatarSyncWorker],
})
export class AvatarSyncModule {}
