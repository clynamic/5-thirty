import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEventEntity } from 'src/post-event/post-event.entity';

import { PostReplacementEntity } from '../post-replacement.entity';
import { PostReplacementMetricController } from './post-replacement-metric.controller';
import { PostReplacementMetricService } from './post-replacement-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostReplacementEntity, PostEventEntity])],
  controllers: [PostReplacementMetricController],
  providers: [PostReplacementMetricService],
  exports: [PostReplacementMetricService],
})
export class PostReplacementMetricModule {}
