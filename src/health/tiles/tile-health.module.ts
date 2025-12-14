import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManifestEntity } from 'src/manifest/manifest.entity';
import { PostPendingTilesModule } from 'src/post/tiles/post-pending-tiles.module';
import { UploadTilesModule } from 'src/upload/tiles/upload-tiles.module';

import { TileHealthController } from './tile-health.controller';
import { TileHealthService } from './tile-health.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManifestEntity]),
    UploadTilesModule,
    PostPendingTilesModule,
  ],
  controllers: [TileHealthController],
  providers: [TileHealthService],
  exports: [TileHealthService],
})
export class TileHealthModule {}
