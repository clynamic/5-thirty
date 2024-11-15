import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostVersionEntity } from 'src/post_version/post_version.entity';
import { UserHeadModule } from 'src/user/head/user-head.module';

import { UploadMetricController } from './upload-metric.controller';
import { UploadMetricService } from './upload-metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostVersionEntity]), UserHeadModule],
  controllers: [UploadMetricController],
  providers: [UploadMetricService],
})
export class UploadMetricModule {}
