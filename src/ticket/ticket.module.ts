import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest';

import { TicketMetricModule } from './metric';
import { TicketEntity } from './ticket.entity';
import { TicketService } from './ticket.service';
import { TicketWorker } from './ticket.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity]),
    ManifestModule,
    TicketMetricModule,
  ],
  controllers: [],
  providers: [TicketService, TicketWorker],
})
export class TicketModule {}
