import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHeadModule } from 'src/user/head/user-head.module';

import { ApprovalEntity } from '../approval.entity';
import { ApprovalMetricController } from './approval-metric.controller';
import { ApprovalMetricService } from './approval-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity]), UserHeadModule],
  controllers: [ApprovalMetricController],
  providers: [ApprovalMetricService],
})
export class ApprovalMetricModule {}
