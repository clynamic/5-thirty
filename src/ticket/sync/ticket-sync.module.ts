import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';
import { UserSyncModule } from 'src/user/sync/user-sync.module';

import { TicketEntity } from '../ticket.entity';
import { TicketSyncService } from './ticket-sync.service';
import { TicketSyncWorker } from './ticket-sync.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity]),
    ManifestModule,
    UserSyncModule,
  ],
  providers: [TicketSyncService, TicketSyncWorker],
})
export class TicketSyncModule {}
