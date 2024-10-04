import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlagEntity } from 'src/flag/flag.entity';

import { DeletionMetricController } from './deletion-metric.controller';
import { DeletionMetricService } from './deletion-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlagEntity])],
  providers: [DeletionMetricService],
  controllers: [DeletionMetricController],
})
export class DeletionMetricModule {}
