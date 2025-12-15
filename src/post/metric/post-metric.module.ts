import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { PostEventEntity } from '../../post-event/post-event.entity';
import { PostLifecycleEntity } from '../lifecycle/post-lifecycle.entity';
import { PostEntity } from '../post.entity';
import { PostPendingTilesEntity } from '../tiles/post-pending-tiles.entity';
import { PostMetricController } from './post-metric.controller';
import { PostMetricService } from './post-metric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostVersionEntity,
      PostEventEntity,
      PermitEntity,
      PostPendingTilesEntity,
      PostLifecycleEntity,
    ]),
  ],
  controllers: [PostMetricController],
  providers: [PostMetricService],
})
export class PostMetricModule {}
