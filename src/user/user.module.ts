import { Module } from '@nestjs/common';

import { UserSyncModule } from './sync/user-sync.module';

@Module({
  imports: [UserSyncModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
