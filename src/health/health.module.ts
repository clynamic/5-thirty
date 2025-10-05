import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { ManifestHealthModule } from './manifests/manifest-health.module';

@Module({
  imports: [ManifestHealthModule],
  controllers: [HealthController],
})
export class HealthModule {}
