import { Module } from '@nestjs/common';

import { MotdController } from './motd.controller';
import { MotdService } from './motd.service';

@Module({
  controllers: [MotdController],
  providers: [MotdService],
})
export class MotdModule {}
