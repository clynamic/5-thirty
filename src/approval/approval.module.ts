import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestModule } from 'src/manifest';

import { ApprovalEntity } from './approval.entity';
import { ApprovalMetricModule } from './metric';
import { ApprovalSyncModule } from './sync';

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
