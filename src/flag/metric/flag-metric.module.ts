import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FlagEntity } from '../flag.entity';
import { FlagMetricController } from './flag-metric.controller';
import { FlagMetricService } from './flag-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlagEntity])],
  controllers: [FlagMetricController],
  providers: [FlagMetricService],
})
export class FlagMetricModule {}
