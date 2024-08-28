import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest';

import { TicketEntity } from '../ticket.entity';
import { TicketSyncService } from './ticket-sync.service';
import { TicketSyncWorker } from './ticket-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), ManifestModule],
  controllers: [],
  providers: [TicketSyncService, TicketSyncWorker],
})
export class TicketSyncModule {}
