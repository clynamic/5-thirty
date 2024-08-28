import { Module } from '@nestjs/common';
import { ApprovalMetricService } from './approval-metric.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from '../approval.entity';
import { ApprovalMetricController } from './approval-metric.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity])],
  controllers: [ApprovalMetricController],
  providers: [ApprovalMetricService],
})
export class ApprovalMetricModule {}
