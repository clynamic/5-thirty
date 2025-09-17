import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from 'src/auth/auth.guard';
import { DecodedJwt } from 'src/auth/auth.service';

import { DailyActivity, Motd, defaultMotd } from './gadget.dto';
import { GadgetService } from './gadget.service';

@ApiTags('Gadgets')
@Controller('gadgets')
export class GadgetController {
  constructor(private readonly gadgetService: GadgetService) {}

  @Get('motd')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Get today's message of the day",
    description:
      'Returns the message of the day selected for today based on date, schedule, and tier. Unauthenticated users receive the default message.',
    operationId: 'getMotd',
  })
  @ApiResponse({
    status: 200,
    description: "Today's message of the day",
    type: Motd,
  })
  async getMotd(@Req() req: { user?: DecodedJwt }): Promise<Motd> {
    if (!req.user) {
      return new Motd({ message: defaultMotd });
    }

    return this.gadgetService.getMotd();
  }

  @Get('activity')
  @ApiOperation({
    summary: "Get today's activity counter",
    description: "Returns today's activity counter",
    operationId: 'getDailyActivity',
  })
  @ApiResponse({
    status: 200,
    description: "Today's activity counter",
    type: DailyActivity,
  })
  async getDailyActivity(): Promise<DailyActivity> {
    return this.gadgetService.getDailyActivity();
  }
}
