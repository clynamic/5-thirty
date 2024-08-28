import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest';

import { ApprovalEntity } from './approval.entity';
import { ApprovalService } from './approval.service';
import { ApprovalWorker } from './approval.worker';
import { ApprovalMetricModule } from './metric';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalEntity]),
    ManifestModule,
    ApprovalMetricModule,
  ],
  controllers: [],
  providers: [ApprovalService, ApprovalWorker],
})
export class ApprovalModule {}
