import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { ManifestHealthModule } from './manifests/manifest-health.module';
import { TileHealthModule } from './tiles/tile-health.module';

@Module({
  imports: [ManifestHealthModule, TileHealthModule],
  controllers: [HealthController],
})
export class HealthModule {}
