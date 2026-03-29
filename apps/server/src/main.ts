import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './server';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PocketFlow API')
      .setDescription('Backend API for the PocketFlow personal finance app')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
