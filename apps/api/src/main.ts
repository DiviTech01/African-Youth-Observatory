import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

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
      `The AYD API provides access to youth-disaggregated data across all 54 African countries.

## Authentication
Most GET endpoints are public. Protected endpoints require a Bearer token obtained via \`POST /api/auth/signin\`.

## Rate Limiting
- Public: 100 requests/minute
- Authenticated: 500 requests/minute

## Data Coverage
- 54 African countries
- 9 thematic areas
- 59+ indicators
- Data from 2000–2024

## Sources
World Bank, ILO, UNESCO, national statistics bureaus`,
    )
    .setVersion('1.0.0')
    .setContact('AYD Team', 'https://africanyouthdatabase.org', 'info@africanyouthdatabase.org')
    .setLicense('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/')
    .addBearerAuth()
    .addTag('countries', 'Country data and profiles')
    .addTag('themes', 'Thematic areas')
    .addTag('indicators', 'Youth indicators')
    .addTag('data', 'Indicator values and data queries')
    .addTag('youth-index', 'Youth Empowerment & Development Index')
    .addTag('compare', 'Country, regional, and thematic comparisons')
    .addTag('policy-monitor', 'AYC compliance and youth policy tracking')
    .addTag('insights', 'AI-powered data insights and analysis')
    .addTag('nlq', 'Natural language data queries')
    .addTag('experts', 'Youth expert directory')
    .addTag('dashboards', 'Custom dashboard management')
    .addTag('export', 'Data export (CSV, JSON, Excel, PDF)')
    .addTag('embed', 'Embeddable charts and widgets')
    .addTag('search', 'Global search across all entities')
    .addTag('live-feed', 'Real-time data feed')
    .addTag('auth', 'Authentication and user management')
    .addTag('admin', 'Platform administration')
    .addTag('platform', 'Platform stats and health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`🌍 AYD API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  console.log(`📊 19 modules loaded | 18 Swagger tags`);
}

bootstrap();
