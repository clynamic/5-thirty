import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotableUserEntity } from '../notable-user.entity';
import { UserEntity } from '../user.entity';
import { UserSyncService } from './user-sync.service';
import { UserSyncWorker } from './user-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([NotableUserEntity, UserEntity])],
  controllers: [],
  providers: [UserSyncService, UserSyncWorker],
  exports: [UserSyncService],
})
export class UserSyncModule {}
