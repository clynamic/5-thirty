import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermitEntity } from '../permit.entity';
import { PermitMetricController } from './permit-metric.controller';
import { PermitMetricService } from './permit-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermitEntity])],
  controllers: [PermitMetricController],
  providers: [PermitMetricService],
})
export class PermitMetricModule {}
