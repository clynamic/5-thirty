import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { BulkUpdateRequestEntity } from 'src/bulk-update-request/bulk-update-request.entity';
import { FeedbackEntity } from 'src/feedback/feedback.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { ModActionEntity } from 'src/mod-action/mod-action.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManifestEntity,
      TicketEntity,
      ApprovalEntity,
      FlagEntity,
      FeedbackEntity,
      PostVersionEntity,
      PostReplacementEntity,
      ModActionEntity,
      BulkUpdateRequestEntity,
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
