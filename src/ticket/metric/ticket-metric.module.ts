import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TicketEntity } from '../ticket.entity';
import { TicketMetricController } from './ticket-metric.controller';
import { TicketMetricService } from './ticket-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity])],
  controllers: [TicketMetricController],
  providers: [TicketMetricService],
  exports: [TicketMetricService],
})
export class TicketMetricModule {}
