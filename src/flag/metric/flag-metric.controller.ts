import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';

import { FlagMetricService } from './flag-metric.service';

@ApiTags('Flags')
@Controller('flags/metric')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Janitor)
@ApiBearerAuth()
export class FlagMetricController {
  constructor(private readonly flagMetricService: FlagMetricService) {}
}
