import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { UserHeadModule } from 'src/user/head/user-head.module';

import { ApprovalMetricController } from './approval-metric.controller';
import { ApprovalMetricService } from './approval-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEventEntity]), UserHeadModule],
  controllers: [ApprovalMetricController],
  providers: [ApprovalMetricService],
})
export class ApprovalMetricModule {}
