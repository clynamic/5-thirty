import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthLevel, RolesGuard } from 'src/auth/auth.guard';
import { UserLevel } from 'src/auth/auth.level';

import { UserHead } from './user-head.dto';
import { UserHeadService } from './user-head.service';

@ApiTags('Users')
@Controller('users/head')
@UseGuards(RolesGuard)
@AuthLevel(UserLevel.Member)
@ApiBearerAuth()
export class UserHeadController {
  constructor(private readonly userHeadService: UserHeadService) {}

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user head',
    description: 'Get user head by user id',
    operationId: 'getUserHead',
  })
  @ApiResponse({
    status: 200,
    type: UserHead,
  })
  getUserHead(@Param('id') id: number): Promise<UserHead> {
    return this.userHeadService.get(id, {
      fetchMissing: true,
      staleness: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
