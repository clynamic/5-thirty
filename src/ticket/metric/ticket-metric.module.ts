import { Module } from '@nestjs/common';
import { TicketMetricController } from './ticket-metric.controller';
import { TicketMetricService } from './ticket-metric.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from '../ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity])],
  controllers: [TicketMetricController],
  providers: [TicketMetricService],
})
export class TicketMetricModule {}
