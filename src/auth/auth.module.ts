import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard, RolesGuard } from './auth.guard';
import { readJwtSecret } from './auth.utils';
import { AxiosAuthService } from './axios-auth.service';
import { JwtStrategy } from './auth.stragety';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: readJwtSecret(config),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AxiosAuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtModule, AxiosAuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
