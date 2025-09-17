import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from 'src/auth/auth.guard';
import { DecodedJwt } from 'src/auth/auth.service';

import { Motd, defaultMotd } from './motd.dto';
import { MotdService } from './motd.service';

@ApiTags('Gadgets')
@Controller('gadgets')
export class MotdController {
  constructor(private readonly motdService: MotdService) {}

  @Get('motd')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: "Get today's message of the day",
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

    return this.motdService.getMotd();
  }
}
