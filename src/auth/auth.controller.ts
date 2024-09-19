import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TokenValidation, UserCredentials } from './auth.dto';
import { JwtAuthGuard } from './auth.guard';
import { AuthService, DecodedJwt } from './auth.service';

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
  @ApiResponse({
    status: 201,
    description: 'Token',
    type: String,
  })
  async login(@Body() credentials: UserCredentials): Promise<string> {
    const user = await this.authService.getUserForCredentials(credentials);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.createToken(credentials, user);
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate token',
    description: 'Validate JWT token',
    operationId: 'validateToken',
  })
  @ApiResponse({
    status: 201,
    description: 'Whether the token is valid',
    type: Boolean,
  })
  async validate(@Body() validation: TokenValidation): Promise<boolean> {
    try {
      await this.authService.validateToken(validation.token);
      return true;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        return false;
      } else {
        throw error;
      }
    }
  }

  @Get('is-admin')
  @ApiOperation({
    summary: 'Check if the current user is admin',
    description: 'Check if the current user is admin',
    operationId: 'isAdmin',
  })
  @ApiResponse({
    status: 201,
    description: 'Whether the user is admin',
    type: Boolean,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async isAdmin(@Req() req: { user: DecodedJwt }): Promise<boolean> {
    return this.authService.isServerAdmin(req.user);
  }
}
