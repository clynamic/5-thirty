import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/auth.guard';
import { DecodedJwt } from 'src/auth/auth.service';

import { DashboardConfig, DashboardUpdate } from './dashboard.dto';
import { DashboardType } from './dashboard.entity';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':type')
  @ApiOperation({
    summary: 'Get dashboard',
    description: 'Get dashboard by type, for the current user',
    operationId: 'getDashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard object',
    type: DashboardConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'Dashboard not found',
  })
  async get(
    @Param('type') type: DashboardType,
    @Request() req: { user: DecodedJwt },
  ): Promise<DashboardConfig> {
    const result = await this.dashboardService.get(req.user.userId, type);
    if (!result) {
      throw new NotFoundException('Dashboard not found');
    }
    return new DashboardConfig(result);
  }

  @Post(':type')
  @ApiOperation({
    summary: 'Update dashboard',
    description: 'Update dashboard by type, for the current user',
    operationId: 'updateDashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated dashboard object',
  })
  async update(
    @Param('type') type: DashboardType,
    @Request() req: { user: DecodedJwt },
    @Body() update: DashboardUpdate,
  ): Promise<void> {
    await this.dashboardService.update(req.user.userId, type, update);
  }
}
