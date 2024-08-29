import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest/manifest.module';

import { ApprovalEntity } from './approval.entity';
import { ApprovalMetricModule } from './metric/approval-metric.module';
import { ApprovalSyncModule } from './sync/approval-sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalEntity]),
    ManifestModule,
    ApprovalMetricModule,
    ApprovalSyncModule,
  ],
  controllers: [],
  providers: [],
})
export class ApprovalModule {}
