import { Module } from '@nestjs/common';

import { UserHeadModule } from './head/user-head.module';
import { UserSyncModule } from './sync/user-sync.module';

@Module({
  imports: [UserSyncModule, UserHeadModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
