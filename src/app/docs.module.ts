import { Module, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { name, version, description } from '../../package.json';

@Module({})
export class DocsModule {
  static setupSwagger(app: INestApplication) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(name)
      .setDescription(description)
      .setVersion(version)
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('', app, swaggerDocument);
  }
}
