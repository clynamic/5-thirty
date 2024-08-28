import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserCredentials } from './auth.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({
    summary: 'Login',
    description: 'Login with username and password',
    operationId: 'login',
  })
  async login(@Body() credentials: UserCredentials): Promise<string> {
    const user = await this.authService.getUserForCredentials(credentials);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return await this.authService.createToken(credentials, user);
  }
}
