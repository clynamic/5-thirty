import { Module } from '@nestjs/common';

import { UserSyncModule } from './sync';

@Module({
  imports: [UserSyncModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
