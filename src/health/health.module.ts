import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulkUpdateRequestEntity } from 'src/bulk-update-request/bulk-update-request.entity';
import { FeedbackEntity } from 'src/feedback/feedback.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { ModActionEntity } from 'src/mod-action/mod-action.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TagAliasEntity } from 'src/tag-alias/tag-alias.entity';
import { TagImplicationEntity } from 'src/tag-implication/tag-implication.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PostEventEntity } from 'src/post-event/post-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManifestEntity,
      PostEventEntity,
      TicketEntity,
      FlagEntity,
      FeedbackEntity,
      PostVersionEntity,
      PostReplacementEntity,
      ModActionEntity,
      BulkUpdateRequestEntity,
      TagAliasEntity,
      TagImplicationEntity,
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
