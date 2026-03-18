import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('African Youth Database API')
    .setDescription(
      'REST API for the African Youth Database — continental data intelligence platform covering youth-disaggregated data across all 54 African countries.',
    )
    .setVersion('1.0')
    .addTag('countries', 'Country data and statistics')
    .addTag('themes', 'Thematic areas')
    .addTag('indicators', 'Data indicators')
    .addTag('data', 'Indicator values and data queries')
    .addTag('youth-index', 'African Youth Index rankings')
    .addTag('auth', 'Authentication')
    .addTag('platform', 'Platform stats and health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`🌍 AYD API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
