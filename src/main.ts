import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { DocsModule } from './app/docs.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  DocsModule.setupSwagger(app);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      const regexes = [
        /^(https?:\/\/)?(localhost)(:\d+)?(\/.*)?$/,
        /^(https?:\/\/)?(127\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/,
        /^(https?:\/\/)?(0:0:0:0:0:0:0:1)(:\d+)?(\/.*)?$/,
      ];

      if (!origin || regexes.some((regex) => regex.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };

  app.enableCors(corsOptions);

  await app.listen(3000);
}
bootstrap();
