import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { PermitEntity } from 'src/permit/permit.entity';
import { PostVersionEntity } from 'src/post_version/post_version.entity';

import { PostEntity } from '../post.entity';
import { PostMetricController } from './post-metric.controller';
import { PostMetricService } from './post-metric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostVersionEntity,
      ApprovalEntity,
      FlagEntity,
      PermitEntity,
    ]),
  ],
  controllers: [PostMetricController],
  providers: [PostMetricService],
})
export class PostMetricModule {}
