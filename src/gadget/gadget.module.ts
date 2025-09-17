import { Module } from '@nestjs/common';

import { ActivityModule } from './activity/activity.module';
import { MotdModule } from './motd/motd.module';

@Module({
  imports: [MotdModule, ActivityModule],
})
export class GadgetModule {}
