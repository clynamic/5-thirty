import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserCredentials } from './auth.dto';
import { RolesGuard } from './auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Login with username and api key',
    operationId: 'login',
  })
  async login(@Body() credentials: UserCredentials): Promise<string> {
    const user = await this.authService.getUserForCredentials(credentials);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return await this.authService.createToken(credentials, user);
  }

  @Get('validate')
  @ApiOperation({
    summary: 'Validate',
    description: 'Validate token',
    operationId: 'validate',
  })
  @ApiResponse({ status: 200, description: 'When token is valid' })
  @ApiResponse({ status: 401, description: 'When token is invalid' })
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  async validate(): Promise<void> {}
}
