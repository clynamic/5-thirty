import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEventEntity } from 'src/post-event/post-event.entity';

import { DeletionMetricController } from './deletion-metric.controller';
import { DeletionMetricService } from './deletion-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEventEntity])],
  providers: [DeletionMetricService],
  controllers: [DeletionMetricController],
})
export class DeletionMetricModule {}
