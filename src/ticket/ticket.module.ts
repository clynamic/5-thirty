import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './ticket.entity';
import { TicketService } from './ticket.service';
import { ManifestModule } from 'src/manifest';
import { TicketWorker } from './ticket.worker';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), ManifestModule],
  controllers: [],
  providers: [TicketService, TicketWorker],
})
export class TicketModule {}
