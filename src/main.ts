import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { CorsConfigModule } from './app/cors.module';
import { DocsModule } from './app/docs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsConfig = app.get(CorsConfigModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  DocsModule.setupSwagger(app);

  app.enableCors(corsConfig.createCorsOptions());

  await app.listen(3000);
}
bootstrap();
