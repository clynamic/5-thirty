import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostReplacementEntity } from '../post-replacement.entity';
import { PostReplacementMetricController } from './post-replacement-metric.controller';
import { PostReplacementMetricService } from './post-replacement-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostReplacementEntity])],
  controllers: [PostReplacementMetricController],
  providers: [PostReplacementMetricService],
})
export class PostReplacementMetricModule {}
