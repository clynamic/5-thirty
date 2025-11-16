import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { UploadTilesModule } from 'src/upload/tiles/upload-tiles.module';

import { TileHealthController } from './tile-health.controller';
import { TileHealthService } from './tile-health.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManifestEntity]), UploadTilesModule],
  controllers: [TileHealthController],
  providers: [TileHealthService],
  exports: [TileHealthService],
})
export class TileHealthModule {}
