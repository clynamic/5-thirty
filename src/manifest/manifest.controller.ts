import { Controller, UseGuards } from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth';

@ApiTags('Manifest')
@Controller('manifests')
@UseGuards(RolesGuard)
export class ManifestController {
  constructor(private readonly manifestService: ManifestService) {}

  // TODO: endpoint to check if coverage for range is available
}
