import { Module } from '@nestjs/common';

import { TicketMetricModule } from './metric';
import { TicketSyncModule } from './sync';

@Module({
  imports: [TicketSyncModule, TicketMetricModule],
  controllers: [],
  providers: [],
})
export class TicketModule {}
