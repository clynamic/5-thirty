import { Module } from '@nestjs/common';

import { AvatarSyncModule } from './avatar/avatar-sync.module';
import { UserHeadModule } from './head/user-head.module';
import { UserSyncModule } from './sync/user-sync.module';

@Module({
  imports: [UserSyncModule, UserHeadModule, AvatarSyncModule],
})
export class UserModule {}
