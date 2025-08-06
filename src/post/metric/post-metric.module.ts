import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';

import { PostEventEntity } from '../../post-event/post-event.entity';
import { PostEntity } from '../post.entity';
import { PostMetricController } from './post-metric.controller';
import { PostMetricService } from './post-metric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostVersionEntity,
      PostEventEntity,
      PermitEntity,
    ]),
  ],
  controllers: [PostMetricController],
  providers: [PostMetricService],
})
export class PostMetricModule {}
