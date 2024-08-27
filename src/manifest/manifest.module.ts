import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestEntity } from './manifest.entity';
import { ManifestService } from './manifest.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManifestEntity])],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
