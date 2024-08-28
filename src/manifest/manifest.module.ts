import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestEntity } from './manifest.entity';
import { ManifestService } from './manifest.service';
import { ManifestController } from './manifest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ManifestEntity])],
  controllers: [ManifestController],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
