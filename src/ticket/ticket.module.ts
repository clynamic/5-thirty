import { Module } from '@nestjs/common';

import { TicketMetricModule } from './metric/ticket-metric.module';
import { TicketSyncModule } from './sync/ticket-sync.module';

@Module({
  imports: [TicketSyncModule, TicketMetricModule],
})
export class TicketModule {}
