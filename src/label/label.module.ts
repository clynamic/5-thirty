import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LabelEntity } from './label.entity';
import { LabelService } from './label.service';

@Module({
  imports: [TypeOrmModule.forFeature([LabelEntity])],
  providers: [LabelService],
  exports: [LabelService],
})
export class LabelModule {}
