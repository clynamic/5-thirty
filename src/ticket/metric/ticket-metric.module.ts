import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHeadModule } from 'src/user/head/user-head.module';

import { TicketEntity } from '../ticket.entity';
import { TicketMetricController } from './ticket-metric.controller';
import { TicketMetricService } from './ticket-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), UserHeadModule],
  controllers: [TicketMetricController],
  providers: [TicketMetricService],
  exports: [TicketMetricService],
})
export class TicketMetricModule {}
