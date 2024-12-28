import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from 'src/approval/approval.entity';
import { FlagEntity } from 'src/flag/flag.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { UserEntity } from 'src/user/user.entity';

import { PerformanceMetricController } from './performance-metric.controller';
import { PerformanceMetricService } from './performance-metric.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PostVersionEntity,
      PostReplacementEntity,
      TicketEntity,
      ApprovalEntity,
      FlagEntity,
    ]),
  ],
  controllers: [PerformanceMetricController],
  providers: [PerformanceMetricService],
})
export class PerformanceMetricModule {}
