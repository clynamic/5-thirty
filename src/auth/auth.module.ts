import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { readJwtSecret } from './auth.utils';
import { AxiosAuthService } from './axios-auth.service';

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
  providers: [AuthService, AxiosAuthService, JwtAuthGuard],
  exports: [JwtModule, AxiosAuthService],
})
export class AuthModule {}
