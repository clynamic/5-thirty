import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManifestEntity, TicketEntity, ApprovalEntity]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
