import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketMetricModule } from 'src/ticket/metric/ticket-metric.module';

import { UserEntity } from '../user.entity';
import { UserSyncService } from './user-sync.service';
import { UserSyncWorker } from './user-sync.worker';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), TicketMetricModule],
  controllers: [],
  providers: [UserSyncService, UserSyncWorker],
})
export class UserSyncModule {}
