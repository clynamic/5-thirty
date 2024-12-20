import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

export enum AppConfigKeys {
  E621_GLOBAL_USERNAME = 'E621_GLOBAL_USERNAME',
  E621_GLOBAL_API_KEY = 'E621_GLOBAL_API_KEY',
  CORS_ALLOWED_ORIGINS = 'CORS_ALLOWED_ORIGINS',
  DATA_DIR = 'DATA_DIR',
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object<Record<AppConfigKeys, Joi.Schema>>({
        E621_GLOBAL_USERNAME: Joi.string().required(),
        E621_GLOBAL_API_KEY: Joi.string().required(),
        CORS_ALLOWED_ORIGINS: Joi.alternatives()
          .try(Joi.string(), Joi.array().items(Joi.string()))
          .optional(),
        DATA_DIR: Joi.string().optional().default('./data'),
      }),
    }),
  ],
})
export class AppConfigModule {}
