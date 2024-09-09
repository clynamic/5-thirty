import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

export enum AppConfigKeys {
  E621_GLOBAL_USERNAME = 'E621_GLOBAL_USERNAME',
  E621_GLOBAL_API_KEY = 'E621_GLOBAL_API_KEY',
  DATABASE_URL = 'DATABASE_URL',
  JWT_SECRET_FILE = 'JWT_SECRET_FILE',
  CORS_ALLOWED_ORIGINS = 'CORS_ALLOWED_ORIGINS',
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object<Record<AppConfigKeys, Joi.Schema>>({
        E621_GLOBAL_USERNAME: Joi.string().required(),
        E621_GLOBAL_API_KEY: Joi.string().required(),
        DATABASE_URL: Joi.string().optional(),
        JWT_SECRET_FILE: Joi.string().optional(),
        CORS_ALLOWED_ORIGINS: Joi.alternatives()
          .try(Joi.string(), Joi.array().items(Joi.string()))
          .optional(),
      }),
    }),
  ],
})
export class AppConfigModule {}
