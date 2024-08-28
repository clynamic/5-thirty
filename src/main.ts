import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocsModule } from './app';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  DocsModule.setupSwagger(app);

  await app.listen(3000);
}
bootstrap();
