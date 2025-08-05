import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEventEntity } from 'src/post-event/post-event.entity';
import { PostReplacementEntity } from 'src/post-replacement/post-replacement.entity';
import { PostVersionEntity } from 'src/post-version/post-version.entity';
import { TicketEntity } from 'src/ticket/ticket.entity';
import { UserHeadModule } from 'src/user/head/user-head.module';
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
      PostEventEntity,
    ]),
    UserHeadModule,
  ],
  controllers: [PerformanceMetricController],
  providers: [PerformanceMetricService],
})
export class PerformanceMetricModule {}
