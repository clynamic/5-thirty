import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalEntity } from './approval.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalWorker } from './approval.worker';
import { ManifestModule } from 'src/manifest';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalEntity]), ManifestModule],
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalWorker],
})
export class ApprovalModule {}
