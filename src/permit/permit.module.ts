import { Module } from '@nestjs/common';

import { PermitSyncModule } from './sync/permit-sync.module';

@Module({
  imports: [PermitSyncModule],
  controllers: [],
  providers: [],
})
export class PermitModule {}
